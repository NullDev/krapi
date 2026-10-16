import { KrunkerTokenError } from "./errors.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/** the claims of a frvr access token (RS256, about 24 h, seen 2026-10-15); nothing here is verified, krunker does that */
export type TokenClaims = {
    /** the player's frvr user id, the only stable key for caching anything read with this token */
    sub: string;
    iss: string;
    /** unix seconds */
    iat: number;
    exp: number;
    extra?: unknown;
};

/** a token this close to expiry is treated as expired, so a request never goes out with one that dies in flight */
const EXPIRY_MARGIN_S = 30;

const JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

// atob instead of Buffer so the same file runs in node, bun and a browser
const base64UrlToUtf8 = (segment: string): string => {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(segment.length / 4) * 4, "=");
    return new TextDecoder().decode(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)));
};

/** reads the claims without verifying the signature; throws KrunkerTokenError for anything that is not a live jwt */
export function decodeToken(token: string): TokenClaims {
    if (typeof token !== "string" || !JWT.test(token)) throw new KrunkerTokenError("token is not a jwt");
    let claims: Partial<TokenClaims>;
    try {
        claims = JSON.parse(base64UrlToUtf8(token.split(".")[1]!)) as Partial<TokenClaims>;
    }
    catch {
        throw new KrunkerTokenError("token payload is not json");
    }
    if (typeof claims !== "object" || claims === null || typeof claims.sub !== "string" || typeof claims.exp !== "number") throw new KrunkerTokenError("token has no sub or exp");
    if (claims.exp - EXPIRY_MARGIN_S <= Date.now() / 1000) throw new KrunkerTokenError("token is expired");
    return claims as TokenClaims;
}

export const bearer = (token: string): Record<string, string> => ({ Authorization: `Bearer ${token}` });
