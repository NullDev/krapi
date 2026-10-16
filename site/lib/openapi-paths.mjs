// maps the `GET /path` lines of the hand written docs to the operations of openapi.json; shared by the sync script and the remark plugin
import { readFileSync } from "node:fs";
import { join } from "node:path";

// relative to the site directory, where the build runs: the macro inlines this module under .source/, so its own url is no anchor
export const SPEC_FILE = join(process.cwd(), "public", "openapi.json");

/** `/api/player/:playername/matches?page=` and `/api/player/{playerName}/matches` become the same key */
export const normalizePath = (path) => path.replace(/\?.*$/, "").toLowerCase().replace(/(:[a-z_]+|\{[a-z_]+\})/g, "{}");

/** the lines of a ```http block that name an endpoint */
export const endpointLines = (code) => [...code.matchAll(/^(GET|POST|PUT|PATCH|DELETE) (\S+)/gm)].map((m) => ({ method: m[1].toLowerCase(), path: m[2] }));

export function loadSpec(){
    const spec = JSON.parse(readFileSync(SPEC_FILE, "utf8"));
    const index = new Map();
    for (const [path, item] of Object.entries(spec.paths)){
        for (const [method, operation] of Object.entries(item)) index.set(`${method} ${normalizePath(path)}`, { path, method, operation });
    }
    return { spec, operationFor: ({ method, path }) => index.get(`${method} ${normalizePath(path)}`) };
}
