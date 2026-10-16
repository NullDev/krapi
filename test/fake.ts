import type { FetchLike } from "../src/client.js";

export type Call = {
    url: string;
    headers: Record<string, string>;
};

export type Reply = {
    status?: number;
    body?: unknown;
    headers?: Record<string, string>;
} | Error;

export type Fake = {
    calls: Call[];
    fetch: FetchLike;
};

const toResponse = (reply: Exclude<Reply, Error>): Response => {
    const { body: raw } = reply;
    let body = "";
    if (typeof raw === "string") body = raw;
    else if (raw !== undefined) body = JSON.stringify(raw);
    return new Response(body, { status: reply.status ?? 200, headers: reply.headers ?? {} });
};

/** a fetch that answers from a list (one per call, the last one repeats) or a function of the call */
export function fakeFetch(replies: Reply[] | ((call: Call) => Reply)): Fake {
    const calls: Call[] = [];
    return {
        calls,
        fetch: async(url: string, init?: RequestInit): Promise<Response> => {
            const call = { url, headers: { ...(init?.headers as Record<string, string>) } };
            calls.push(call);
            const reply = typeof replies === "function" ? replies(call) : replies[Math.min(calls.length - 1, replies.length - 1)]!;
            if (reply instanceof Error) throw reply;
            return toResponse(reply);
        },
    };
}

export const ok = (body: unknown, headers?: Record<string, string>): Reply => ({ status: 200, body, headers });

/** what gapi wraps its replies in */
export const envelope = (data: unknown, headers?: Record<string, string>): Reply => ok({ data, error: null }, headers);

export const timeoutError = (): Error => {
    const err = new Error("The operation was aborted due to timeout");
    err.name = "TimeoutError";
    return err;
};

/** an unsigned jwt whose claims are what the tests say, the signature is never checked locally */
export const jwt = (claims: Record<string, unknown>): string => {
    const part = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString("base64url");
    return `${part({ alg: "RS256", typ: "JWT" })}.${part(claims)}.c2ln`;
};

export const liveClaims = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    sub: "player-123",
    iss: "frvr",
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...extra,
});
