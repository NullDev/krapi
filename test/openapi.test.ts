import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildSpec } from "../scripts/openapi.js";

type Json = Record<string, unknown>;

const root = join(import.meta.dir, "..");
const { spec, warnings } = buildSpec();
const paths = spec.paths as Record<string, { get: Json }>;
const schemas = (spec.components as Json).schemas as Json;

/** every route name the resources declare */
function routes(): string[] {
    const found: string[] = [];
    for (const tier of ["developer", "game", "token"]){
        const dir = join(root, "src", tier, "resources");
        for (const file of readdirSync(dir)){
            for (const match of readFileSync(join(dir, file), "utf8").matchAll(/route: "([^"]+)"/g)) found.push(match[1]!);
        }
    }
    return found;
}

function refs(node: unknown, into: string[] = []): string[] {
    if (Array.isArray(node)) node.forEach((n) => refs(n, into));
    else if (node && typeof node === "object"){
        for (const [key, value] of Object.entries(node)){
            if (key === "$ref" && typeof value === "string") into.push(value);
            else refs(value, into);
        }
    }
    return into;
}

describe("openapi", () => {
    test("the generator understands every resource", () => {
        expect(warnings).toEqual([]);
    });

    test("every route is an operation and every operation has a route", () => {
        const operationIds = Object.values(paths).map((item) => item.get.operationId as string);
        const covered = new Set(Object.values(paths).flatMap((item) => item.get["x-routes"] as string[]));
        for (const route of routes()) expect(covered).toContain(route);
        expect(new Set(operationIds).size).toBe(operationIds.length);
    });

    test("path placeholders and path parameters match", () => {
        for (const [path, item] of Object.entries(paths)){
            const placeholders = [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]!);
            const declared = (item.get.parameters as { name: string; in: string; required: boolean }[]).filter((p) => p.in === "path");
            expect(declared.map((p) => p.name).sort()).toEqual([...placeholders].sort());
            for (const p of declared) expect(p.required).toBe(true);
        }
    });

    test("every operation answers with a typed body and every $ref resolves", () => {
        for (const item of Object.values(paths)){
            const body = ((item.get.responses as Json)[200] as Json).content as Json;
            const schema = (body["application/json"] as Json).schema as Json;
            expect(Object.keys(schema).length).toBeGreaterThan(0);
        }
        for (const ref of refs(spec)){
            expect(ref.startsWith("#/components/schemas/")).toBe(true);
            expect(schemas[ref.slice("#/components/schemas/".length)]).toBeDefined();
        }
    });

    test("the checked in openapi.json is current (run bun run openapi)", () => {
        const committed = JSON.parse(readFileSync(join(root, "openapi.json"), "utf8")) as Json;
        expect(committed).toEqual(spec);
    });

    test("the developer doc's field descriptions reach the schemas", () => {
        const profile = schemas.PlayerProfile as { properties: Record<string, { description?: string }> };
        expect(profile.properties.player_id!.description).toBe("Unique player identifier");
        expect(profile.properties.clan!.description).toBe("empty when not in a clan");
        const op = paths["/api/player/{playerName}"]!.get;
        expect(op.summary).toBe("Get Player Profile");
        expect(op.security).toEqual([{ developerApiKey: [] }]);
    });
});
