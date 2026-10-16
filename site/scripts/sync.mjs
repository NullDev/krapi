// fills content/docs: the hand written pages from ../docs and the library reference typedoc generates from ../src.
// also writes one slice of openapi.json per operation, the Scalar block under every endpoint of the API docs renders from it
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { endpointLines, loadSpec, SPEC_FILE } from "../lib/openapi-paths.mjs";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(site, "..");
const content = join(site, "content", "docs");
const reference = join(content, "reference");

rmSync(join(site, "content"), { recursive: true, force: true });
mkdirSync(content, { recursive: true });
cpSync(join(root, "docs"), content, { recursive: true });

execFileSync("npx", ["typedoc"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
// the OpenAPI document behind the endpoint blocks of the API docs and the /openapi download, generated from the same source and docs
execFileSync("bun", ["scripts/openapi.ts", SPEC_FILE], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });

// "Class: Krunker" is redundant inside the Classes group of the sidebar
const titleOf = (text) => text.match(/^#+ (.+)$/m)?.[1]?.replace(/\\/g, "").replace(/^(Class|Function|Type Alias|Variable|Interface|Enumeration): /, "") ?? "Reference";

/** typedoc writes no frontmatter, fumadocs needs a title; the first heading becomes it and is dropped from the body */
function addFrontmatter(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()){
            addFrontmatter(path);
            continue;
        }
        if (!entry.name.endsWith(".md")) continue;
        const text = readFileSync(path, "utf8");
        const title = entry.name === "index.md" && dir === reference ? "Library reference" : titleOf(text);
        const body = text.replace(/^#+ .+\n/m, "");
        writeFileSync(path, `---\ntitle: "${title.replace(/"/g, "\\\"")}"\n---\n\n${body}`);
    }
}
addFrontmatter(reference);

/**
 * `[x](../types/Foo.md)` becomes a link relative to the page url (`../../types/Foo/`): fumadocs resolves
 * relative file links in prose but not inside tables, and every page is a folder in the export
 */
function rewriteLinks(dir){
    for (const entry of readdirSync(dir, { withFileTypes: true })){
        const path = join(dir, entry.name);
        if (entry.isDirectory()){
            rewriteLinks(path);
            continue;
        }
        if (!entry.name.endsWith(".md")) continue;
        const fileDir = relative(content, dir).split(sep).join("/");
        const pageUrl = entry.name === "index.md" ? fileDir : posix.join(fileDir, entry.name.slice(0, -3));
        const text = readFileSync(path, "utf8").replace(/\]\(([^)\s:]+?\.md)(#[^)]*)?\)/g, (_, target, hash = "") => {
            const targetPath = posix.normalize(posix.join(fileDir, target));
            const targetUrl = targetPath.endsWith("/index.md") || targetPath === "index.md" ? posix.dirname(targetPath) : targetPath.slice(0, -3);
            const rel = posix.relative(pageUrl || ".", targetUrl === "." ? "" : targetUrl);
            return `](${rel ? `${rel}/` : "./"}${hash})`;
        });
        writeFileSync(path, text);
    }
}
rewriteLinks(content);

/**
 * public/openapi/<operationId>.json: one operation with the schemas it reaches, the servers and the auth of the document.
 * its description stays out, the markdown around the block carries the prose; its tags too, the block has no tag header
 */
const { spec, operationFor } = loadSpec();
const slices = join(site, "public", "openapi");
rmSync(slices, { recursive: true, force: true });
mkdirSync(slices, { recursive: true });
for (const [path, item] of Object.entries(spec.paths)){
    for (const [method, operation] of Object.entries(item)){
        const { description, tags, ...rest } = operation;
        const paths = { [path]: { [method]: rest } };
        const schemas = new Set();
        const visit = (node) => {
            if (Array.isArray(node)) node.forEach(visit);
            else if (node && typeof node === "object"){
                for (const [key, value] of Object.entries(node)){
                    const name = key === "$ref" && typeof value === "string" ? value.split("/").pop() : undefined;
                    if (name === undefined) visit(value);
                    else if (!schemas.has(name)){
                        schemas.add(name);
                        visit(spec.components.schemas[name]);
                    }
                }
            }
        };
        visit(paths);
        writeFileSync(join(slices, `${operation.operationId}.json`), JSON.stringify({
            openapi: spec.openapi,
            info: { title: operation.summary, version: spec.info.version },
            servers: operation.servers ?? spec.servers.slice(0, 1),
            paths,
            components: { securitySchemes: spec.components.securitySchemes, schemas: Object.fromEntries([...schemas].map((name) => [name, spec.components.schemas[name]])) },
        }));
    }
}

/** every endpoint the docs name must be an operation of the document, or its section would miss the block */
const missing = [];
for (const file of readdirSync(content).filter((f) => f.endsWith("-api.md"))){
    for (const block of readFileSync(join(content, file), "utf8").matchAll(/^```http\n([\s\S]*?)^```/gm)){
        for (const line of endpointLines(block[1])) if (!operationFor(line)) missing.push(`${file}: ${line.method.toUpperCase()} ${line.path}`);
    }
}
if (missing.length) throw new Error(`endpoints of the docs without an operation in openapi.json:\n${missing.join("\n")}`);

// typedoc folder names become the sidebar groups
const groups = { classes: "Classes", functions: "Functions", "type-aliases": "Types", variables: "Constants", interfaces: "Interfaces", enumerations: "Enums" };
const present = readdirSync(reference, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
writeFileSync(join(reference, "meta.json"), JSON.stringify({
    title: "Library reference",
    pages: ["index", ...present.filter((g) => g in groups)],
}, null, 4));
for (const group of present){
    if (group in groups) writeFileSync(join(reference, group, "meta.json"), JSON.stringify({ title: groups[group] }, null, 4));
}

console.log(`synced ${readdirSync(content).length} entries into content/docs`);
