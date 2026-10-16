import { describe, expect, test } from "bun:test";
import { GLOBAL_LIMIT, RateLimitTracker } from "../src/rateLimit.js";

const headers = (limit: number, remaining: number, reset: number): Headers =>
    new Headers({ "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": String(remaining), "X-RateLimit-Reset": String(reset) });

describe("RateLimitTracker", () => {
    test("a key sized window with a unix reset is the global one", () => {
        const tracker = new RateLimitTracker();
        const resetAt = Math.floor(Date.now() / 1000) + 30;
        const window = tracker.observe("player.profile", headers(GLOBAL_LIMIT, 100, resetAt));
        expect(window).toEqual({ limit: GLOBAL_LIMIT, remaining: 100, resetAt: resetAt * 1000 });
        expect(tracker.snapshot().global).toEqual(window);
        expect(tracker.snapshot().routes).toEqual({});
    });

    test("a small window with a relative reset belongs to the route", () => {
        const tracker = new RateLimitTracker();
        const before = Date.now();
        const window = tracker.observe("game.market.stats", headers(5, 4, 1))!;
        expect(window.limit).toBe(5);
        expect(window.resetAt).toBeGreaterThanOrEqual(before + 1000);
        expect(window.resetAt).toBeLessThanOrEqual(Date.now() + 1000);
        expect(tracker.snapshot().global).toBeNull();
        expect(Object.keys(tracker.snapshot().routes)).toEqual(["game.market.stats"]);
    });

    test("missing headers are ignored", () => {
        const tracker = new RateLimitTracker();
        expect(tracker.observe("x", new Headers())).toBeNull();
        expect(tracker.observe("x", new Headers({ "X-RateLimit-Limit": "5" }))).toBeNull();
        expect(tracker.blockedFor("x")).toBe(0);
    });

    test("blockedFor counts the seconds left once a window is empty", () => {
        const tracker = new RateLimitTracker();
        const now = Date.now();
        tracker.observe("a", headers(5, 0, 1));
        expect(tracker.blockedFor("a", now)).toBe(1);
        expect(tracker.blockedFor("b", now)).toBe(0);
        expect(tracker.blockedFor("a", now + 1500)).toBe(0);
        tracker.observe("a", headers(5, 3, 1));
        expect(tracker.blockedFor("a", now)).toBe(0);
    });

    test("an empty global window blocks every route", () => {
        const tracker = new RateLimitTracker();
        const now = Date.now();
        tracker.observe("a", headers(GLOBAL_LIMIT, 0, Math.ceil(now / 1000) + 10));
        expect(tracker.blockedFor("anything", now)).toBeGreaterThanOrEqual(10);
    });

    test("exhaust marks the route's own window when it has one, else the key", () => {
        const tracker = new RateLimitTracker();
        const now = Date.now();
        tracker.observe("a", headers(5, 5, 1));
        tracker.exhaust("a", 3, now);
        expect(tracker.blockedFor("a", now)).toBe(3);
        expect(tracker.blockedFor("b", now)).toBe(0);
        tracker.exhaust("b", 7, now);
        expect(tracker.blockedFor("c", now)).toBe(7);
        expect(tracker.snapshot().global?.limit).toBe(GLOBAL_LIMIT);
    });

    test("snapshot hands out copies", () => {
        const tracker = new RateLimitTracker();
        tracker.observe("a", headers(5, 5, 1));
        const snap = tracker.snapshot();
        snap.routes.a!.remaining = 0;
        expect(tracker.snapshot().routes.a!.remaining).toBe(5);
    });
});
