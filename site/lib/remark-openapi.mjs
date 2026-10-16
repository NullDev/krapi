// wraps every endpoint section of the API docs (its heading through the notes before the next heading) in an
// <APIEndpoint />: the section's prose and tables on the left, followed by Scalar's parameter and response lists, and
// Scalar's request and response examples on the right. the path block and the JSON reply leave the body, Scalar shows both.
// a section without Parameters or Response Fields tables of its own (the game and token docs) gets them from the document
import { endpointLines, loadSpec } from "./openapi-paths.mjs";

const isHttp = (node) => node.type === "code" && node.lang === "http";
const isTypeBlock = (node) => node.type === "code" && node.lang === "ts" && /^type \w+ = \{/.test(node.value);
const isLabel = (node, label) => node.type === "paragraph" && node.children.length === 1 && node.children[0].type === "strong"
    && node.children[0].children[0]?.value === label;
const hasLabel = (nodes, label) => nodes.some((node) => isLabel(node, label));

/* ---------- tables from the document ---------- */

const text = (value) => ({ type: "text", value: String(value ?? "") });
const code = (value) => ({ type: "inlineCode", value: String(value) });
const cell = (children) => ({ type: "tableCell", children });
const row = (cells) => ({ type: "tableRow", children: cells.map((c) => cell(Array.isArray(c) ? c : [c])) });
const label = (value) => ({ type: "paragraph", children: [{ type: "strong", children: [text(value)] }] });
const table = (head, rows) => ({ type: "table", align: head.map(() => null), children: [row(head.map(text)), ...rows] });

/** the one-line description of a schema, markdown stripped to its text */
const describe = (schema) => (schema?.description ?? "").replace(/\s+/g, " ").trim();

/** `string`, `number`, `"a" | "b"`, `object`, `number[]`, `string or null` */
function typeOf(schema, deref){
    const resolved = deref(schema);
    if (!resolved) return "unknown";
    if (resolved.anyOf){
        const members = resolved.anyOf.map(deref).filter(Boolean);
        const nullable = members.some((m) => m.type === "null");
        const rest = members.filter((m) => m.type !== "null");
        const inner = rest.length === 1 ? typeOf(rest[0], deref) : rest.map((m) => typeOf(m, deref)).join(" or ");
        return nullable ? `${inner} or null` : inner;
    }
    if (resolved.enum) return resolved.enum.map((v) => JSON.stringify(v)).join(" | ");
    if (resolved.const !== undefined) return JSON.stringify(resolved.const);
    if (resolved.type === "array") return `${typeOf(resolved.items, deref)}[]`;
    if (resolved.type === "object" || resolved.properties) return "object";
    if (Array.isArray(resolved.type)) return resolved.type.join(" or ");
    return resolved.type ?? "unknown";
}

/** rows of a schema's fields, nested objects as `a.b`, arrays of objects as `a[].b` */
function fieldRows(schema, deref, prefix = "", depth = 0, rows = []){
    const resolved = deref(schema);
    if (!resolved || rows.length > 120) return rows;
    const inner = resolved.anyOf ? deref(resolved.anyOf.map(deref).find((m) => m && m.type !== "null")) : resolved;
    if (!inner) return rows;
    if (inner.type === "array") return fieldRows(inner.items, deref, prefix ? `${prefix}[].` : "", depth, rows);
    for (const [name, property] of Object.entries(inner.properties ?? {})){
        const field = `${prefix}${name}`;
        rows.push(row([code(field), text(typeOf(property, deref)), text(describe(deref(property)))]));
        const target = deref(property);
        const nested = target?.anyOf ? deref(target.anyOf.map(deref).find((m) => m && m.type !== "null")) : target;
        const items = nested?.type === "array" ? deref(nested.items) : nested;
        if (depth < 2 && items?.properties) fieldRows(items, deref, nested?.type === "array" ? `${field}[].` : `${field}.`, depth + 1, rows);
    }
    return rows;
}

/** the reply of an operation: gapi's {data, error} envelope is unwrapped, the docs describe `data` */
function replySchema(operation, deref){
    const schema = deref(operation.responses?.["200"]?.content?.["application/json"]?.schema);
    const data = schema?.properties?.data;
    return data && schema.properties?.error ? data : schema;
}

function parameterTable(operation, deref){
    const parameters = operation.parameters ?? [];
    if (parameters.length === 0) return [];
    return [label("Parameters:"), table(["Name", "Type", "Location", "Required", "Description"], parameters.map((p) =>
        row([code(p.name), text(typeOf(p.schema, deref)), text(p.in), text(p.required ? "yes" : "no"), text((p.description ?? "").replace(/\s+/g, " "))])))];
}

function fieldTable(operation, deref){
    const rows = fieldRows(replySchema(operation, deref), deref);
    if (rows.length === 0) return [];
    return [label("Response Fields:"), table(["Field", "Type", "Description"], rows)];
}

/* ---------- sections ---------- */

/** the indexes of the heading that opens the section a node sits in, and where that section ends */
function sectionAround(children, index){
    let start = index;
    while (start > 0 && children[start].type !== "heading") start--;
    const depth = children[start].type === "heading" ? children[start].depth : 6;
    let end = index + 1;
    while (end < children.length && !(children[end].type === "heading" && children[end].depth <= depth) && children[end].type !== "thematicBreak") end++;
    return { start, end };
}

/** the section's nodes without the path block and the `**Response:**` example; the type blocks go when a field table replaces them */
function stripped(nodes, dropTypes){
    const kept = [];
    for (let i = 0; i < nodes.length; i++){
        const node = nodes[i];
        if (isHttp(node) || (dropTypes && isTypeBlock(node))) continue;
        if (isLabel(node, "Response:") && nodes[i + 1]?.type === "code"){
            i++;
            continue;
        }
        kept.push(node);
    }
    return kept;
}

export function remarkOpenApi(){
    const { spec, operationFor } = loadSpec();
    const deref = (schema) => {
        if (!schema) return undefined;
        if (typeof schema.$ref === "string") return deref(spec.components.schemas[schema.$ref.split("/").pop()]);
        return schema;
    };
    return (tree) => {
        const children = tree.children;
        for (let i = 0; i < children.length; i++){
            if (!isHttp(children[i])) continue;
            const { start, end } = sectionAround(children, i);
            const section = children.slice(start, end);
            const hits = section.filter(isHttp).flatMap((node) => endpointLines(node.value).map(operationFor).filter(Boolean));
            if (hits.length === 0) continue;
            const body = stripped(section, !hasLabel(section, "Response Fields:"));
            // the docs' own tables stay; a section without them gets the document's, one set per endpoint it names
            const tables = hits.flatMap(({ operation, method, path }) => {
                const title = hits.length > 1 ? [{ type: "paragraph", children: [text(`${method.toUpperCase()} ${path}`)] }] : [];
                const parameters = hasLabel(section, "Parameters:") ? [] : parameterTable(operation, deref);
                const fields = hasLabel(section, "Response Fields:") ? [] : fieldTable(operation, deref);
                return parameters.length || fields.length ? [...title, ...parameters, ...fields] : [];
            });
            children.splice(start, end - start, {
                type: "mdxJsxFlowElement",
                name: "APIEndpoint",
                attributes: [{ type: "mdxJsxAttribute", name: "operations", value: hits.map((hit) => hit.operation.operationId).join(" ") }],
                children: [...body, ...tables],
            });
            i = start;
        }
    };
}
