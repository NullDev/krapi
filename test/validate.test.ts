import { describe, expect, test } from "bun:test";
import { KrunkerArgumentError } from "../src/errors.js";
import * as check from "../src/validate.js";

describe("validate", () => {
    test("names are url encoded, empty or long ones refused", () => {
        expect(check.name("Nul Ping", "x")).toBe("Nul%20Ping");
        expect(check.text("abc", "x")).toBe("abc");
        expect(() => check.name("", "playerName")).toThrow(KrunkerArgumentError);
        expect(() => check.name("   ", "playerName")).toThrow(/playerName/);
        expect(() => check.name("a".repeat(65), "playerName")).toThrow(/too long/);
        expect(() => check.name(5 as unknown as string, "playerName")).toThrow(KrunkerArgumentError);
    });

    test("ints hold their bounds", () => {
        expect(check.int(3, "n", 1, 5)).toBe(3);
        expect(() => check.int(0, "n", 1)).toThrow(/between 1 and/);
        expect(() => check.int(1.5, "n", 0)).toThrow(KrunkerArgumentError);
        expect(() => check.int(NaN, "n", 0)).toThrow(KrunkerArgumentError);
        expect(check.optionalInt(undefined, "n", 0)).toBeUndefined();
        expect(check.page(undefined)).toBeUndefined();
        expect(() => check.page(0)).toThrow(/page/);
    });

    test("ids keep every digit past 2^53", () => {
        expect(check.id(42, "matchId")).toBe("42");
        expect(check.id("123456789012345678901" .slice(0, 20), "matchId")).toBe("12345678901234567890");
        expect(check.id(12345678901234567890n, "matchId")).toBe("12345678901234567890");
        expect(() => check.id(-1n, "matchId")).toThrow(KrunkerArgumentError);
        expect(() => check.id("12a", "matchId")).toThrow(KrunkerArgumentError);
        expect(() => check.id(-1, "matchId")).toThrow(KrunkerArgumentError);
    });

    test("months are YYYY-MM", () => {
        expect(check.month("2026-08", "month")).toBe("2026-08");
        expect(() => check.month("2026-13", "month")).toThrow(/YYYY-MM/);
        expect(() => check.month("8", "month")).toThrow(KrunkerArgumentError);
    });

    test("oneOf and list", () => {
        expect(check.oneOf("a", ["a", "b"], "sort")).toBe("a");
        expect(check.oneOf(undefined, ["a"], "sort")).toBeUndefined();
        expect(() => check.oneOf("c" as "a", ["a", "b"], "sort")).toThrow(/one of a, b/);
        expect(check.list([1, 2, 3])).toBe("1,2,3");
        expect(check.list([])).toBeUndefined();
        expect(check.list(undefined)).toBeUndefined();
        expect(() => check.list([1, -1])).toThrow(KrunkerArgumentError);
    });

    test("leaderboard type and order", () => {
        expect(check.leaderboardType("time")).toBe("time");
        expect(() => check.leaderboardType("kills" as "time")).toThrow(/score/);
        expect(check.leaderboardOrder(1)).toBe(1);
        expect(() => check.leaderboardOrder(2 as 1)).toThrow(/0 or 1/);
    });
});
