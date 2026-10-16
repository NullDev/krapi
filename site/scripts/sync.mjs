// fills content/docs: the hand written pages from ../docs, then the library reference typedoc generates from ../src
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(site, "..");
const content = join(site, "content", "docs");
const reference = join(content, "reference");

rmSync(join(site, "content"), { recursive: true, force: true });
mkdirSync(content, { recursive: true });
cpSync(join(root, "docs"), content, { recursive: true });

execFileSync("npx", ["typedoc"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });

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
