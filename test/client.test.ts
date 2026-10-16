import { describe, expect, test } from "bun:test";
import { KrunkerClient } from "../src/client.js";
import {
    KrunkerBadRequestError,
    KrunkerConfigError,
    KrunkerForbiddenError,
    KrunkerHttpError,
    KrunkerNetworkError,
    KrunkerNotFoundError,
    KrunkerRateLimitError,
    KrunkerServerError,
    KrunkerUnauthorizedError,
    isRateLimited,
    isTransient,
} from "../src/errors.js";
import { fakeFetch, ok, timeoutError } from "./fake.js";

const caught = async(run: () => Promise<unknown>): Promise<unknown> => {
    try {
        await run();
        return null;
    }
    catch (err){
        return err;
    }
};

describe("KrunkerClient", () => {
    test("sends the key, the user agent and the query, skips undefined values", async() => {
        const fake = fakeFetch([ok({ fine: true })]);
        const client = new KrunkerClient({ apiKey: "k", userAgent: "ua/1", baseUrl: "https://x.test///", fetch: fake.fetch });
        const body = await client.get("/api/a", { route: "a", query: { page: 2, skip: undefined, name: "Nul Ping" } });
        expect(body).toEqual({ fine: true });
        expect(fake.calls[0]!.url).toBe("https://x.test/api/a?page=2&name=Nul+Ping");
        expect(fake.calls[0]!.headers).toEqual({ Accept: "application/json", "X-Developer-API-Key": "k", "User-Agent": "ua/1" });
    });

    test("no key header without a key, per call headers go through", async() => {
        const fake = fakeFetch([ok({})]);
        const client = new KrunkerClient({ fetch: fake.fetch });
        await client.get("/x", { route: "x", headers: { Authorization: "Bearer t" } });
        expect(fake.calls[0]!.headers).toEqual({ Accept: "application/json", Authorization: "Bearer t" });
    });

    test("an empty key is not configured and never sends", async() => {
        const fake = fakeFetch([ok({})]);
        const client = new KrunkerClient({ apiKey: "", fetch: fake.fetch });
        expect(client.configured).toBe(false);
        expect(await caught(() => client.get("/x", { route: "x" }))).toBeInstanceOf(KrunkerConfigError);
        expect(fake.calls).toHaveLength(0);
    });

    test("maps the status codes and keeps the body", async() => {
        const cases: [number, unknown, unknown, string][] = [
            [400, { error: { code: "SOCIAL_INVALID_TAB", message: "bad tab" } }, KrunkerBadRequestError, "bad tab"],
            [401, { error: "invalid token" }, KrunkerUnauthorizedError, "invalid token"],
            [403, { error: "forbidden" }, KrunkerForbiddenError, "forbidden"],
            [404, "Not Found", KrunkerNotFoundError, "Not Found"],
            [418, "", KrunkerHttpError, "418"],
            [502, "<html>bad gateway</html>", KrunkerServerError, "502"],
        ];
        for (const [status, body, type, text] of cases){
            const fake = fakeFetch([{ status, body }]);
            const err = await caught(() => new KrunkerClient({ fetch: fake.fetch, retries: 0 }).get("/x", { route: "x" }));
            expect(err).toBeInstanceOf(type);
            expect((err as Error).message).toContain(text);
            expect((err as KrunkerHttpError).status).toBe(status);
            expect((err as KrunkerHttpError).body).toEqual(body === "" ? null : body);
        }
    });

    test("a 429 blocks the route until retry_after, the next call is refused without a request", async() => {
        const fake = fakeFetch([{ status: 429, body: { error: "slow down", retry_after: 7 } }, ok({})]);
        const client = new KrunkerClient({ fetch: fake.fetch });
        const first = await caught(() => client.get("/x", { route: "x" }));
        expect(first).toBeInstanceOf(KrunkerRateLimitError);
        expect((first as KrunkerRateLimitError).retryAfter).toBe(7);
        expect((first as KrunkerRateLimitError).preemptive).toBe(false);
        const second = await caught(() => client.get("/y", { route: "y" }));
        expect(isRateLimited(second)).toBe(true);
        expect((second as KrunkerRateLimitError).preemptive).toBe(true);
        expect(isTransient(second)).toBe(true);
        expect(fake.calls).toHaveLength(1);
    });

    test("a 429 without a body takes Retry-After, else one second", async() => {
        const fake = fakeFetch([{ status: 429, headers: { "Retry-After": "3" } }, { status: 429 }]);
        const client = new KrunkerClient({ fetch: fake.fetch });
        expect(((await caught(() => client.get("/x", { route: "x" }))) as KrunkerRateLimitError).retryAfter).toBe(3);
        const other = new KrunkerClient({ fetch: fakeFetch([{ status: 429 }]).fetch });
        expect(((await caught(() => other.get("/x", { route: "x" }))) as KrunkerRateLimitError).retryAfter).toBe(1);
    });

    test("a short empty window is waited out, not refused", async() => {
        const fake = fakeFetch([ok({}, { "X-RateLimit-Limit": "5", "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "1" }), ok({ second: true })]);
        const client = new KrunkerClient({ fetch: fake.fetch });
        await client.get("/x", { route: "x" });
        const started = Date.now();
        expect(await client.get("/x", { route: "x" })).toEqual({ second: true });
        expect(Date.now() - started).toBeGreaterThanOrEqual(900);
        expect(fake.calls).toHaveLength(2);
    });

    test("retries once after a 5xx or a network error, never after a 4xx", async() => {
        const recovered = fakeFetch([{ status: 503 }, ok({ up: true })]);
        expect(await new KrunkerClient({ fetch: recovered.fetch }).get("/x", { route: "x" })).toEqual({ up: true });
        expect(recovered.calls).toHaveLength(2);

        const down = fakeFetch([{ status: 500 }]);
        expect(await caught(() => new KrunkerClient({ fetch: down.fetch }).get("/x", { route: "x" }))).toBeInstanceOf(KrunkerServerError);
        expect(down.calls).toHaveLength(2);

        const flaky = fakeFetch([new Error("ECONNRESET"), ok({})]);
        expect(await new KrunkerClient({ fetch: flaky.fetch }).get("/x", { route: "x" })).toEqual({});

        const bad = fakeFetch([{ status: 400 }]);
        expect(await caught(() => new KrunkerClient({ fetch: bad.fetch }).get("/x", { route: "x" }))).toBeInstanceOf(KrunkerBadRequestError);
        expect(bad.calls).toHaveLength(1);

        const none = fakeFetch([{ status: 500 }]);
        await caught(() => new KrunkerClient({ fetch: none.fetch, retries: 0 }).get("/x", { route: "x" }));
        expect(none.calls).toHaveLength(1);
    });

    test("a timeout is a network error that says so", async() => {
        const fake = fakeFetch([timeoutError()]);
        const err = await caught(() => new KrunkerClient({ fetch: fake.fetch, retries: 0, timeoutMs: 50 }).get("/x", { route: "x" }));
        expect(err).toBeInstanceOf(KrunkerNetworkError);
        expect((err as KrunkerNetworkError).timeout).toBe(true);
        expect((err as Error).message).toContain("50ms");
        expect((err as Error).cause).toBeInstanceOf(Error);
    });

    test("the logger sees every reply and a window running low", async() => {
        const debug: string[] = [];
        const warn: string[] = [];
        const fake = fakeFetch([ok({}, { "X-RateLimit-Limit": "240", "X-RateLimit-Remaining": "10", "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + 30) })]);
        const client = new KrunkerClient({ apiKey: "k", fetch: fake.fetch, logger: { debug: (m): number => debug.push(m), warn: (m): number => warn.push(m) } });
        await client.get("/x", { route: "x" });
        expect(debug).toHaveLength(1);
        expect(debug[0]).toMatch(/^krunker api: 200 .*\(10\/240 left\)$/);
        expect(warn).toHaveLength(1);
        expect(warn[0]).toContain("10 of 240 requests left on the key");
    });

    test("without a logger nothing is logged and nothing throws", async() => {
        const fake = fakeFetch([ok({})]);
        expect(await new KrunkerClient({ fetch: fake.fetch }).get("/x", { route: "x" })).toEqual({});
    });
});
