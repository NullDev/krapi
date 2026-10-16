import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createGenerator } from "ts-json-schema-generator";
import ts from "typescript";
import { GAPI_URL, LEGACY_API_URL, MATCHMAKER_URL } from "../src/index.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/*
 * builds an OpenAPI 3.1 document from the resource classes: every `client.get(path, {route, query})` call becomes an
 * operation, its path template and query object become the parameters, the type argument becomes the response and
 * the exported types become the component schemas. the developer doc's field tables fill in descriptions the types lack.
 *
 *   bun scripts/openapi.ts [out.json]
 */

type Json = Record<string, unknown>;

type Param = {
    name: string;
    in: "path" | "query";
    required: boolean;
    schema: Json;
    description?: string;
    style?: string;
    explode?: boolean;
};

type Segment = { text: string; params: Param[] };

type Operation = {
    tier: Tier;
    file: string;
    className: string;
    method: string;
    route: string;
    paths: Segment[];
    query: Param[];
    response: Json;
    summary: string;
    description: string;
    host: string;
};

type Tier = "developer" | "game" | "token";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version: string; homepage: string };

const TIERS: Record<Tier, { title: string; dir: string; accessor: string; security: Json[]; hosts: Record<string, string>; doc: string; error: Json }> = {
    developer: {
        title: "Developer API",
        dir: "src/developer/resources",
        accessor: "krunker",
        security: [{ developerApiKey: [] }],
        hosts: {},
        doc: "developer-api.md",
        error: { $ref: "#/components/schemas/ApiErrorBody" },
    },
    game: {
        title: "Game API",
        dir: "src/game/resources",
        accessor: "krunker.game",
        security: [],
        hosts: { "legacy.ts": LEGACY_API_URL, "matchmaker.ts": MATCHMAKER_URL },
        doc: "game-api.md",
        error: { $ref: "#/components/schemas/EnvelopeError" },
    },
    token: {
        title: "Token API",
        dir: "src/token/resources",
        accessor: "krunker.as(token)",
        security: [{ accessToken: [] }],
        hosts: { "ranked.ts": LEGACY_API_URL },
        doc: "token-api.md",
        error: { $ref: "#/components/schemas/EnvelopeError" },
    },
};

const warnings: string[] = [];
const warn = (text: string): void => {
    warnings.push(text);
};

/* ---------- typescript program ---------- */

const configFile = ts.readConfigFile(join(root, "tsconfig.json"), ts.sys.readFile);
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
const resourceFiles = (Object.keys(TIERS) as Tier[]).flatMap((tier) =>
    readdirSync(join(root, TIERS[tier].dir)).filter((f) => f.endsWith(".ts")).map((f) => join(root, TIERS[tier].dir, f)));
const indexFiles = (["developer", "game", "token"] as const).map((tier) => join(root, "src", tier, "index.ts"));
const program = ts.createProgram([...resourceFiles, ...indexFiles], config.options);
const checker = program.getTypeChecker();

const jsDocOf = (node: ts.Node): string => {
    const docs = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc);
    return docs.map((doc) => ts.getTextOfJSDocComment(doc.comment) ?? "").join("\n").trim();
};

/** the property name each resource class is reachable by, e.g. PublicTurfApi -> turf */
const accessorOf = new Map<string, string>();
for (const file of indexFiles){
    const source = program.getSourceFile(file);
    if (!source) continue;
    ts.forEachChild(source, function visit(node){
        if (ts.isPropertyDeclaration(node) && node.type && ts.isTypeReferenceNode(node.type) && ts.isIdentifier(node.name)){
            accessorOf.set(node.type.typeName.getText(), node.name.text);
        }
        ts.forEachChild(node, visit);
    });
}

/* ---------- schemas from types ---------- */

/** names of exported types the operations reference; their schemas come from ts-json-schema-generator */
const neededTypes = new Set<string>();

function schemaOfType(type: ts.Type): Json {
    if (type.flags & ts.TypeFlags.Boolean) return { type: "boolean" };
    if (type.flags & ts.TypeFlags.StringLiteral) return { type: "string", "enum": [(type as ts.StringLiteralType).value] };
    if (type.flags & ts.TypeFlags.NumberLiteral) return { type: "number", "enum": [(type as ts.NumberLiteralType).value] };
    if (type.isUnion()){
        const members = type.types.filter((t) => !(t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)));
        if (members.every((t) => t.isLiteral())){
            const values = members.map((t) => (t as ts.LiteralType).value);
            return { type: typeof values[0] === "number" ? "number" : "string", "enum": values };
        }
        if (members.every((t) => t.flags & ts.TypeFlags.BooleanLiteral)) return { type: "boolean" };
        if (members.length === 1 && members[0]) return schemaOfType(members[0]);
    }
    if (type.flags & ts.TypeFlags.Number) return { type: "number" };
    if (type.flags & ts.TypeFlags.String) return { type: "string" };
    return { type: "string" };
}

function schemaOfTypeNode(node: ts.TypeNode): Json {
    if (ts.isTypeReferenceNode(node)){
        const name = node.typeName.getText();
        if (name === "Envelope" && node.typeArguments?.[0]){
            return {
                type: "object",
                description: "gapi wraps every reply in {data, error}",
                properties: { data: schemaOfTypeNode(node.typeArguments[0]), error: { type: "null" } },
                required: ["data", "error"],
            };
        }
        if (name === "Record" && node.typeArguments?.[1]){
            return { type: "object", additionalProperties: schemaOfTypeNode(node.typeArguments[1]) };
        }
        if (node.typeArguments?.length){
            warn(`generic response type ${node.getText()} is not expanded`);
            return {};
        }
        neededTypes.add(name);
        return { $ref: `#/components/schemas/${name}` };
    }
    if (ts.isArrayTypeNode(node)) return { type: "array", items: schemaOfTypeNode(node.elementType) };
    if (ts.isTypeLiteralNode(node)){
        const properties: Json = {};
        const required: string[] = [];
        for (const member of node.members){
            if (!ts.isPropertySignature(member) || !member.type) continue;
            const key = member.name.getText();
            properties[key] = schemaOfTypeNode(member.type);
            if (!member.questionToken) required.push(key);
        }
        return { type: "object", properties, required };
    }
    if (ts.isUnionTypeNode(node)){
        const nullable = node.types.some((t) => (ts.isLiteralTypeNode(t) && t.literal.kind === ts.SyntaxKind.NullKeyword) || t.kind === ts.SyntaxKind.UndefinedKeyword);
        const rest = node.types.filter((t) => !((ts.isLiteralTypeNode(t) && t.literal.kind === ts.SyntaxKind.NullKeyword) || t.kind === ts.SyntaxKind.UndefinedKeyword));
        const inner = rest.length === 1 && rest[0] ? schemaOfTypeNode(rest[0]) : { anyOf: rest.map(schemaOfTypeNode) };
        return nullable ? { anyOf: [inner, { type: "null" }] } : inner;
    }
    if (ts.isParenthesizedTypeNode(node)) return schemaOfTypeNode(node.type);
    if (ts.isLiteralTypeNode(node)){
        if (ts.isStringLiteral(node.literal)) return { type: "string", "const": node.literal.text };
        if (ts.isNumericLiteral(node.literal)) return { type: "number", "const": Number(node.literal.text) };
        if (node.literal.kind === ts.SyntaxKind.NullKeyword) return { type: "null" };
    }
    switch (node.kind){
        case ts.SyntaxKind.StringKeyword: return { type: "string" };
        case ts.SyntaxKind.NumberKeyword: return { type: "number" };
        case ts.SyntaxKind.BooleanKeyword: return { type: "boolean" };
        case ts.SyntaxKind.UnknownKeyword:
        case ts.SyntaxKind.AnyKeyword: return {};
        default:
            warn(`response type ${node.getText()} is not understood`);
            return {};
    }
}

/* ---------- parameters ---------- */

const literalValue = (node: ts.Expression): string | number | boolean | undefined => {
    if (ts.isStringLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isIdentifier(node)){
        const symbol = checker.getSymbolAtLocation(node);
        const declaration = symbol?.valueDeclaration;
        if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer) return literalValue(declaration.initializer);
    }
    return undefined;
};

/** where a value ultimately comes from: a method parameter, a property of one (query.x) or a constant */
type Origin = { name: string; required: boolean; default?: string | number | boolean; description?: string; type?: ts.Type };

function originOf(node: ts.Expression, method: ts.MethodDeclaration): Origin | undefined {
    if (ts.isIdentifier(node)){
        const param = method.parameters.find((p) => ts.isIdentifier(p.name) && p.name.text === node.text);
        if (!param) return undefined;
        const fallback = param.initializer ? literalValue(param.initializer) : undefined;
        return {
            name: node.text,
            required: !param.questionToken && !param.initializer,
            "default": fallback,
            type: checker.getTypeAtLocation(param),
        };
    }
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)){
        const param = method.parameters.find((p) => ts.isIdentifier(p.name) && p.name.text === (node.expression as ts.Identifier).text);
        if (!param) return undefined;
        const property = checker.getTypeAtLocation(param).getProperty(node.name.text);
        const declaration = property?.valueDeclaration;
        const optional = !declaration || !ts.isPropertySignature(declaration) || Boolean(declaration.questionToken);
        return {
            name: node.name.text,
            required: !optional && !param.questionToken && !param.initializer,
            description: property ? ts.displayPartsToString(property.getDocumentationComment(checker)) || undefined : undefined,
            type: property ? checker.getTypeOfSymbolAtLocation(property, node) : undefined,
        };
    }
    return undefined;
}

const calleeName = (node: ts.CallExpression): string => {
    if (ts.isPropertyAccessExpression(node.expression)) return node.expression.name.text;
    if (ts.isIdentifier(node.expression)) return node.expression.text;
    return "";
};

const maxOf = (node: ts.Expression | undefined): number | undefined => {
    const value = node ? literalValue(node) : undefined;
    return typeof value === "number" && value < Number.MAX_SAFE_INTEGER ? value : undefined;
};

function intSchema(min?: ts.Expression, max?: ts.Expression): Json {
    const schema: Json = { type: "integer" };
    const lower = min ? literalValue(min) : undefined;
    const upper = max ? literalValue(max) : undefined;
    if (typeof lower === "number") schema.minimum = lower;
    if (typeof upper === "number" && upper < Number.MAX_SAFE_INTEGER) schema.maximum = upper;
    return schema;
}

const CHECKS: Record<string, (args: readonly ts.Expression[]) => { schema: Json; required?: boolean; style?: boolean }> = {
    page: () => ({ schema: { type: "integer", minimum: 1, "default": 1 }, required: false }),
    optionalInt: (args) => ({ schema: intSchema(args[2], args[3]), required: false }),
    "int": (args) => ({ schema: intSchema(args[2], args[3]) }),
    text: () => ({ schema: { type: "string", minLength: 1 } }),
    name: () => ({ schema: { type: "string", minLength: 1 } }),
    id: () => ({ schema: { type: "string", pattern: "^[0-9]+$", description: "an integer id, passed as a string because it can exceed 2^53" } }),
    month: () => ({ schema: { type: "string", pattern: "^[0-9]{4}-(0[1-9]|1[0-2])$", example: "2026-10" } }),
    list: () => ({ schema: { type: "array", items: { type: "integer" } }, required: false, style: true }),
    textList: (args) => ({ schema: { type: "array", items: { type: "string" }, maxItems: maxOf(args[2]) }, required: false, style: true }),
    idList: (args) => ({ schema: { type: "array", items: { type: "string" }, maxItems: maxOf(args[2]) }, required: false, style: true }),
    leaderboardType: () => ({ schema: { type: "string", "enum": ["score", "time"] }, required: false }),
    leaderboardOrder: () => ({ schema: { type: "integer", "enum": [0, 1] }, required: false }),
    oneOf: () => ({ schema: {}, required: false }),
};

/** the schema and requiredness of one query value expression */
function describeValue(node: ts.Expression, method: ts.MethodDeclaration): Omit<Param, "name" | "in"> {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken){
        const inner = describeValue(node.left, method);
        const fallback = literalValue(node.right);
        return { ...inner, required: false, schema: fallback === undefined ? inner.schema : { ...inner.schema, "default": fallback } };
    }
    if (ts.isNumericLiteral(node) || ts.isStringLiteral(node) || (ts.isIdentifier(node) && literalValue(node) !== undefined)){
        const value = literalValue(node);
        return { required: true, schema: { type: typeof value === "number" ? "integer" : "string", "const": value } };
    }
    if (ts.isConditionalExpression(node)){
        // `flag ? 1 : undefined` and `x === undefined ? undefined : check.text(x)`: the branch that sends something describes it
        const isUndefined = (branch: ts.Expression): boolean => ts.isIdentifier(branch) && branch.text === "undefined";
        const branch = [node.whenTrue, node.whenFalse].find((b) => !isUndefined(b));
        const flag = originOf(ts.isBinaryExpression(node.condition) ? node.condition.left : node.condition, method);
        if (branch && [node.whenTrue, node.whenFalse].some(isUndefined)){
            const value = describeValue(branch, method);
            const fixed = literalValue(branch);
            const note = fixed === undefined || !flag ? undefined : `sent as ${JSON.stringify(fixed)} when \`${flag.name}\` is set`;
            return { ...value, required: false, description: value.description ?? flag?.description ?? note };
        }
    }
    if (ts.isCallExpression(node)){
        const fn = calleeName(node);
        const source = node.arguments[0];
        const origin = source ? originOf(source, method) : undefined;
        const known = CHECKS[fn];
        if (known){
            const { schema, required, style } = known(node.arguments);
            const enumSchema = fn === "oneOf" && origin?.type ? schemaOfType(origin.type) : {};
            const result: Omit<Param, "name" | "in"> = {
                required: required ?? origin?.required ?? false,
                schema: { ...schema, ...enumSchema },
                description: origin?.description,
            };
            if (origin?.default !== undefined) result.schema.default = origin.default;
            if (style){
                result.style = "form";
                result.explode = false;
            }
            return result;
        }
        if (fn === "String" && source) return describeValue(source, method);
        // a local helper such as raidSort(sort): the argument's own type says what is allowed
        if (origin?.type) return { required: origin.required, schema: schemaOfType(origin.type), description: origin.description };
        warn(`${method.name.getText()}: query value ${node.getText()} is not understood`);
        return { required: false, schema: { type: "string" } };
    }
    const origin = originOf(node, method);
    if (origin?.type){
        const schema = schemaOfType(origin.type);
        if (origin.default !== undefined) schema.default = origin.default;
        return { required: origin.required, schema, description: origin.description };
    }
    warn(`${method.name.getText()}: query value ${node.getText()} is not understood`);
    return { required: false, schema: { type: "string" } };
}

/** the path segments one template span stands for; a conditional local can add an optional suffix */
function segmentsOfSpan(node: ts.Expression, method: ts.MethodDeclaration): { fixed: Segment; optional?: Segment } {
    if (ts.isCallExpression(node)){
        const fn = calleeName(node);
        if (fn === "String" && node.arguments[0]) return segmentsOfSpan(node.arguments[0], method);
        const what = node.arguments[1] ? literalValue(node.arguments[1]) : undefined;
        const name = typeof what === "string" ? what : node.arguments[0] && originOf(node.arguments[0], method)?.name;
        if (!name){
            warn(`${method.name.getText()}: path span ${node.getText()} is not understood`);
            return { fixed: { text: `{${node.getText()}}`, params: [] } };
        }
        const value = describeValue(node, method);
        return { fixed: { text: `{${name}}`, params: [{ name, "in": "path", required: true, schema: value.schema, description: value.description }] } };
    }
    if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)){
        const origin = originOf(node, method);
        if (origin?.type){
            return { fixed: { text: `{${origin.name}}`, params: [{ name: origin.name, "in": "path", required: true, schema: schemaOfType(origin.type), description: origin.description }] } };
        }
        if (ts.isIdentifier(node)){
            const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;
            if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer && ts.isConditionalExpression(declaration.initializer)){
                // eslint-disable-next-line no-use-before-define -- the three path walkers are mutually recursive
                return segmentsOfConditional(declaration.initializer, node.text, method);
            }
        }
    }
    warn(`${method.name.getText()}: path span ${node.getText()} is not understood`);
    return { fixed: { text: `{${node.getText()}}`, params: [] } };
}

/** `cond ? "" : \`/region/${x}\`` is an optional suffix; `cond ? "all" : String(x)` is a parameter with a wildcard word */
function segmentsOfConditional(node: ts.ConditionalExpression, name: string, method: ts.MethodDeclaration): { fixed: Segment; optional?: Segment } {
    const empty = (branch: ts.Expression): boolean => ts.isStringLiteral(branch) && branch.text === "";
    if (empty(node.whenTrue) || empty(node.whenFalse)){
        const other = empty(node.whenTrue) ? node.whenFalse : node.whenTrue;
        // eslint-disable-next-line no-use-before-define -- the three path walkers are mutually recursive
        const suffix = ts.isTemplateExpression(other) ? segmentsOfTemplate(other, method) : [{ text: literalValue(other) as string ?? other.getText(), params: [] }];
        const merged = suffix.reduce<Segment>((acc, s) => ({ text: acc.text + s.text, params: [...acc.params, ...s.params] }), { text: "", params: [] });
        return { fixed: { text: "", params: [] }, optional: merged };
    }
    const literalBranch = [node.whenTrue, node.whenFalse].find(ts.isStringLiteral);
    const valueBranch = literalBranch === node.whenTrue ? node.whenFalse : node.whenTrue;
    const value = describeValue(valueBranch, method);
    const schema: Json = literalBranch ? { anyOf: [value.schema, { type: "string", "const": literalBranch.text }] } : value.schema;
    const description = literalBranch ? [value.description, `\`${literalBranch.text}\` stands for every value`].filter(Boolean).join("; ") : value.description;
    return { fixed: { text: `{${name}}`, params: [{ name, "in": "path", required: true, schema, description }] } };
}

/** every path variant a template stands for; an optional suffix doubles them */
function segmentsOfTemplate(node: ts.TemplateExpression, method: ts.MethodDeclaration): Segment[] {
    let variants: Segment[] = [{ text: node.head.text, params: [] }];
    for (const span of node.templateSpans){
        const { fixed, optional } = segmentsOfSpan(span.expression, method);
        variants = variants.flatMap((v) => {
            const base = { text: v.text + fixed.text + span.literal.text, params: [...v.params, ...fixed.params] };
            if (!optional) return [base];
            return [base, { text: v.text + fixed.text + optional.text + span.literal.text, params: [...v.params, ...fixed.params, ...optional.params] }];
        });
    }
    return variants;
}

/* ---------- operations ---------- */

function findGetCall(node: ts.Node): ts.CallExpression | undefined {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "get"
        && ts.isPropertyAccessExpression(node.expression.expression) && ts.isPrivateIdentifier(node.expression.expression.name)){
        return node;
    }
    return ts.forEachChild(node, findGetCall);
}

function collectOperations(): Operation[] {
    const operations: Operation[] = [];
    for (const tier of Object.keys(TIERS) as Tier[]){
        const { dir, hosts } = TIERS[tier];
        for (const file of readdirSync(join(root, dir)).filter((f) => f.endsWith(".ts")).sort()){
            const source = program.getSourceFile(join(root, dir, file));
            if (!source) continue;
            for (const statement of source.statements){
                if (!ts.isClassDeclaration(statement) || !statement.name) continue;
                const className = statement.name.text;
                for (const member of statement.members){
                    if (!ts.isMethodDeclaration(member) || !member.body) continue;
                    const call = findGetCall(member.body);
                    if (!call) continue;
                    const [pathArg, optionsArg] = call.arguments;
                    if (!pathArg || !optionsArg || !ts.isObjectLiteralExpression(optionsArg)) continue;
                    const option = (name: string): ts.Expression | undefined => {
                        const found = optionsArg.properties.find((p) => p.name?.getText() === name);
                        return found && ts.isPropertyAssignment(found) ? found.initializer : undefined;
                    };
                    const routeNode = option("route");
                    const route = routeNode ? literalValue(routeNode) : undefined;
                    if (typeof route !== "string"){
                        warn(`${className}.${member.name.getText()}: no route`);
                        continue;
                    }
                    const paths = ts.isTemplateExpression(pathArg) ? segmentsOfTemplate(pathArg, member)
                        : [{ text: ts.isStringLiteral(pathArg) || ts.isNoSubstitutionTemplateLiteral(pathArg) ? pathArg.text : pathArg.getText(), params: [] }];
                    const query: Param[] = [];
                    const queryNode = option("query");
                    if (queryNode && ts.isObjectLiteralExpression(queryNode)){
                        for (const property of queryNode.properties){
                            const name = property.name?.getText();
                            if (!name) continue;
                            let value: ts.Expression | undefined;
                            if (ts.isPropertyAssignment(property)) value = property.initializer;
                            else if (ts.isShorthandPropertyAssignment(property)) value = property.name;
                            if (!value) continue;
                            query.push({ name, "in": "query", ...describeValue(value, member) });
                        }
                    }
                    const typeArg = call.typeArguments?.[0]
                        ?? (member.type && ts.isTypeReferenceNode(member.type) && member.type.typeName.getText() === "Promise" ? member.type.typeArguments?.[0] : undefined);
                    const response = typeArg ? schemaOfTypeNode(typeArg) : {};
                    if (!typeArg) warn(`${className}.${member.name.getText()}: no response type`);
                    const doc = jsDocOf(member);
                    const summary = doc.replace(/^(GET|POST) \S+,?\s*/, "").split(/(?<=[a-z0-9)])[;.] /)[0]?.trim() ?? "";
                    operations.push({
                        tier,
                        file,
                        className,
                        method: member.name.getText(),
                        route,
                        paths,
                        query,
                        response,
                        summary,
                        description: doc,
                        host: hosts[file] ?? GAPI_URL,
                    });
                }
            }
        }
    }
    return operations;
}

/* ---------- titles and descriptions from the docs ---------- */

type DocTables = Map<string, { title: string; fields: Map<string, string>; params: Map<string, string> }>;

const normalizePath = (path: string): string => path.toLowerCase().replace(/(:[a-z_]+|\{[a-z_]+\})/g, "{}");

/** the heading, Parameters table and Response Fields table of every endpoint section of a doc, keyed by normalized path */
function readDocTables(doc: string): DocTables {
    const tables: DocTables = new Map();
    const text = readFileSync(join(root, "docs", doc), "utf8");
    for (const section of text.split(/^### /m).slice(1)){
        const path = section.match(/^GET (\/[^\s?]+)/m)?.[1];
        if (!path) continue;
        const title = section.split("\n")[0]?.trim() ?? "";
        const rows = (heading: string): Map<string, string> => {
            const map = new Map<string, string>();
            const start = section.indexOf(`**${heading}:**`);
            if (start < 0) return map;
            const block = section.slice(start).split(/\n\s*\n/)[1] ?? "";
            for (const line of block.split("\n")){
                const cells = line.split("|").map((c) => c.trim());
                if (cells.length < 4 || cells[1] === "Field" || cells[1] === "Name" || cells[1]?.startsWith("---")) continue;
                map.set(cells[1]!.replace(/\\/g, ""), cells[cells.length - 2]!);
            }
            return map;
        };
        tables.set(normalizePath(path), { title, fields: rows("Response Fields"), params: rows("Parameters") });
    }
    return tables;
}

/* ---------- assembly ---------- */

function buildSchemas(): Json {
    const generator = createGenerator({
        path: join(root, "src", "index.ts"),
        tsconfig: join(root, "tsconfig.json"),
        type: "*",
        expose: "export",
        topRef: true,
        jsDoc: "extended",
        additionalProperties: true,
        sortProps: false,
        skipTypeCheck: true,
    });
    const schemas: Json = {};
    const pending = [...neededTypes, "ApiErrorBody"];
    const seen = new Set<string>();
    while (pending.length){
        const name = pending.pop()!;
        if (seen.has(name)) continue;
        seen.add(name);
        let definitions: Json;
        try {
            definitions = generator.createSchema(name).definitions as Json;
        }
        catch (err){
            warn(`no schema for ${name}: ${(err as Error).message}`);
            continue;
        }
        for (const [key, value] of Object.entries(definitions)) schemas[key] = value;
    }
    schemas.EnvelopeError = {
        type: "object",
        description: "an error reply of gapi: data is null and error carries a code and a message",
        properties: {
            data: { type: "null" },
            error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" } } },
        },
        required: ["data", "error"],
    };
    return JSON.parse(JSON.stringify(schemas).replace(/#\/definitions\//g, "#/components/schemas/")) as Json;
}

/** follows a `$ref` to its component schema so descriptions land on the shared definition */
const deref = (schema: Json | undefined, schemas: Json): Json | undefined => {
    if (!schema) return undefined;
    const ref = schema.$ref;
    if (typeof ref === "string") return schemas[ref.replace("#/components/schemas/", "")] as Json | undefined;
    if (Array.isArray(schema.anyOf)) return deref(schema.anyOf.find((s: Json) => s.type !== "null") as Json, schemas);
    return schema;
};

function applyFieldDescriptions(response: Json, fields: Map<string, string>, schemas: Json): void {
    for (const [field, description] of fields){
        let current = deref(response, schemas);
        const parts = field.split(".");
        for (const [index, part] of parts.entries()){
            if (!current) break;
            const isList = part.endsWith("[]");
            const key = isList ? part.slice(0, -2) : part;
            const properties = current.properties as Json | undefined;
            const property = properties?.[key] as Json | undefined;
            if (!property) break;
            if (index === parts.length - 1){
                if (!property.description) property.description = description;
                break;
            }
            current = deref(isList ? (deref(property, schemas)?.items as Json | undefined) : property, schemas);
        }
    }
}

export function buildSpec(): { spec: Json; warnings: string[] } {
    warnings.length = 0;
    neededTypes.clear();
    const operations = collectOperations();
    const schemas = buildSchemas();
    const docTables = Object.fromEntries((Object.keys(TIERS) as Tier[]).map((tier) => [tier, readDocTables(TIERS[tier].doc)])) as Record<Tier, DocTables>;
    const paths: Json = {};
    const tags = new Map<string, { name: string; description: string }>();
    const groups: Record<Tier, string[]> = { developer: [], game: [], token: [] };

    for (const op of operations){
        const tier = TIERS[op.tier];
        const accessor = accessorOf.get(op.className) ?? op.className;
        const tag = `${op.tier}/${accessor}`;
        if (!tags.has(tag)){
            const classNode = program.getSourceFile(join(root, tier.dir, op.file))?.statements.find((s) => ts.isClassDeclaration(s) && s.name?.text === op.className);
            tags.set(tag, { name: tag, description: classNode ? jsDocOf(classNode) : "" });
            groups[op.tier].push(tag);
        }
        const tables = docTables[op.tier].get(normalizePath(op.paths[0]?.text ?? ""));
        if (tables) applyFieldDescriptions(op.response, tables.fields, schemas);

        for (const [index, variant] of op.paths.entries()){
            const parameters = [...variant.params, ...op.query].map((p) => {
                const described = { ...p };
                if (!described.description && tables){
                    const fromDoc = tables.params.get(p.name) ?? tables.params.get(p.name.toLowerCase());
                    if (fromDoc) described.description = fromDoc;
                }
                return described;
            });
            const library = `${tier.accessor}.${accessor}.${op.method}()`;
            const item = (paths[variant.text] ??= {}) as Json;
            if (item.get){
                // two methods read the same path with different filters (players.feed and social.feed): one operation, both filters
                const existing = item.get as Json;
                const known = existing.parameters as Param[];
                for (const param of parameters){
                    const same = known.find((k) => k.name === param.name && k.in === param.in);
                    if (same) same.required = same.required && param.required;
                    else known.push({ ...param, required: false });
                }
                existing["x-krapi"] = [existing["x-krapi"], library].flat();
                existing["x-routes"] = [existing["x-routes"], op.route].flat();
                existing.description = `${existing.description as string}\n\nAlso \`${library}\`${op.description ? `: ${op.description}` : ""}`;
                continue;
            }
            const operation: Json = {
                operationId: index === 0 ? op.route : `${op.route}.${variant.params[variant.params.length - 1]?.name ?? index}`,
                summary: tables?.title || op.summary || `${accessor}.${op.method}`,
                description: [op.description, `Library: \`${library}\``].filter(Boolean).join("\n\n"),
                tags: [tag],
                "x-krapi": library,
                "x-routes": [op.route],
                security: tier.security,
                parameters,
                responses: {
                    200: { description: "OK", content: { "application/json": { schema: op.response } } },
                    "default": { description: "Error", content: { "application/json": { schema: tier.error } } },
                },
            };
            if (op.host !== GAPI_URL) operation.servers = [{ url: op.host }];
            item.get = operation;
        }
    }

    const spec: Json = {
        openapi: "3.1.0",
        info: {
            title: "Krunker API",
            version: pkg.version,
            summary: "The Krunker.io developer API, the game's public endpoints and the token bound ones, as krapi wraps them",
            description: `Generated from the krapi source and docs. The developer API is the official one from FRVR and needs an API key; the game and token tiers are the endpoints the game itself reads, documented from observation. Full docs: ${pkg.homepage.replace(/#.*/, "")}`,
            license: { name: "MIT", identifier: "MIT" },
        },
        servers: [
            { url: GAPI_URL, description: "developer API and most game endpoints" },
            { url: LEGACY_API_URL, description: "the old rest api and the ranked api" },
            { url: MATCHMAKER_URL, description: "the lobby list" },
        ],
        tags: [...tags.values()],
        "x-tagGroups": (Object.keys(TIERS) as Tier[]).map((tier) => ({ name: TIERS[tier].title, tags: groups[tier] })),
        paths,
        components: {
            securitySchemes: {
                developerApiKey: { type: "apiKey", "in": "header", name: "X-Developer-API-Key", description: "developer API key (starts with kr_)" },
                accessToken: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "the player's FRVR access token" },
            },
            schemas,
        },
    };
    return { spec, warnings: [...warnings] };
}

if (import.meta.main){
    const out = process.argv[2] ?? join(root, "openapi.json");
    const { spec, warnings: notes } = buildSpec();
    writeFileSync(out, `${JSON.stringify(spec, null, 2)}\n`);
    for (const note of notes) console.warn(`warning: ${note}`);
    console.log(`wrote ${Object.keys(spec.paths as Json).length} paths and ${Object.keys((spec.components as Json).schemas as Json).length} schemas to ${out}`);
}
