import { describe, expect, test } from "bun:test";
import { KrunkerTokenError } from "../src/errors.js";
import { bearer, decodeToken, type TokenClaims } from "../src/jwt.js";
import { jwt, liveClaims } from "./fake.js";

describe("decodeToken", () => {
    test("reads the claims of a live token", () => {
        const claims = liveClaims({ extra: { name: "Nül Pîng ✓" } });
        expect(decodeToken(jwt(claims))).toEqual(claims as TokenClaims);
    });

    test("refuses what is not a jwt", () => {
        expect(() => decodeToken("nope")).toThrow(KrunkerTokenError);
        expect(() => decodeToken("")).toThrow(/not a jwt/);
        expect(() => decodeToken(undefined as unknown as string)).toThrow(KrunkerTokenError);
        expect(() => decodeToken("a.b.c")).toThrow(/not json/);
        expect(() => decodeToken("a.!!!.c")).toThrow(KrunkerTokenError);
    });

    test("needs sub and exp", () => {
        expect(() => decodeToken(jwt({ exp: Date.now() / 1000 + 100 }))).toThrow(/no sub or exp/);
        expect(() => decodeToken(jwt({ sub: "x" }))).toThrow(/no sub or exp/);
        expect(() => decodeToken(`a.${Buffer.from("[1]").toString("base64url")}.c`)).toThrow(/no sub or exp/);
    });

    test("an expired or nearly expired token is refused before a request", () => {
        const now = Math.floor(Date.now() / 1000);
        expect(() => decodeToken(jwt({ sub: "x", exp: now - 1 }))).toThrow(/expired/);
        expect(() => decodeToken(jwt({ sub: "x", exp: now + 10 }))).toThrow(/expired/);
        expect(decodeToken(jwt({ sub: "x", exp: now + 120 })).sub).toBe("x");
    });

    test("bearer builds the header", () => {
        expect(bearer("t")).toEqual({ Authorization: "Bearer t" });
    });
});
