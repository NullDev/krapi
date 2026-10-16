// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/** the headers of every delivery */
export const WEBHOOK_HEADERS = {
    /** the real event id; test and verify sends carry 0 in the body and "test-..." / "verify-..." here */
    eventId: "Krunker-Event-Id",
    eventType: "Krunker-Event-Type",
    deliveryId: "Krunker-Delivery-Id",
    /** 1 on the first try, then 2, 3, ...; can rise without a failure on your side */
    deliveryAttempt: "Krunker-Delivery-Attempt",
    /** "t=<unix seconds>,v1=<hex hmac>" */
    signature: "Krunker-Signature",
} as const;

/** requests whose timestamp is further off than this are rejected, as the docs ask */
export const WEBHOOK_TOLERANCE_S = 5 * 60;

/** the parsed Krunker-Signature header */
export type WebhookSignature = {
    /** unix seconds */
    timestamp: number;
    /** hex hmac-sha256 of "<timestamp>.<raw body>" */
    v1: string;
};

/** the Krunker-Signature header split up, null when it is not of the documented form */
export function parseWebhookSignature(header: string | null | undefined): WebhookSignature | null {
    if (typeof header !== "string") return null;
    const parts = new Map(header.split(",").map((part) => {
        const [key, ...rest] = part.trim().split("=");
        return [key, rest.join("=")] as const;
    }));
    const timestamp = Number(parts.get("t"));
    const v1 = parts.get("v1");
    if (!Number.isInteger(timestamp) || v1 === undefined || !/^[0-9a-f]+$/i.test(v1) || v1.length % 2 !== 0) return null;
    return { timestamp, v1 };
}

const encoder = new TextEncoder();

const fromHex = (hex: string): Uint8Array<ArrayBuffer> => Uint8Array.from(hex.match(/../g) ?? [], (byte) => parseInt(byte, 16));

/** "<timestamp>.<raw body>" as bytes, the body never re-encoded */
const payloadOf = (timestamp: number, rawBody: string | Uint8Array): Uint8Array<ArrayBuffer> => {
    const prefix = encoder.encode(`${timestamp}.`);
    const body = typeof rawBody === "string" ? encoder.encode(rawBody) : rawBody;
    const payload = new Uint8Array(prefix.length + body.length);
    payload.set(prefix);
    payload.set(body, prefix.length);
    return payload;
};

const hmacKey = (secret: string, usage: "sign" | "verify"): Promise<CryptoKey> =>
    crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);

/** knobs of verifyWebhook, for tests and for clocks that drift */
export type VerifyWebhookOptions = {
    /** seconds the timestamp may be off, 300 when omitted */
    toleranceS?: number;
    /** unix ms, now when omitted */
    now?: number;
};

/**
 * true when the delivery was signed with the endpoint's secret and is not older than the tolerance.
 * the body has to be the raw request body, re-serialized json gives a different signature.
 * answer 401 when this is false, the signature check sends deliberately bad signatures and expects that
 */
export async function verifyWebhook(rawBody: string | Uint8Array, signatureHeader: string | null | undefined, secret: string, options: VerifyWebhookOptions = {}): Promise<boolean> {
    const signature = parseWebhookSignature(signatureHeader);
    if (signature === null || typeof secret !== "string" || secret.length === 0) return false;
    const now = (options.now ?? Date.now()) / 1000;
    if (Math.abs(now - signature.timestamp) > (options.toleranceS ?? WEBHOOK_TOLERANCE_S)) return false;

    // subtle.verify compares in constant time
    return crypto.subtle.verify("HMAC", await hmacKey(secret, "verify"), fromHex(signature.v1), payloadOf(signature.timestamp, rawBody));
}

/** the Krunker-Signature value for a body, for tests and for signing your own test deliveries */
export async function signWebhook(rawBody: string | Uint8Array, secret: string, timestamp = Math.floor(Date.now() / 1000)): Promise<string> {
    const mac = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret, "sign"), payloadOf(timestamp, rawBody)));
    return `t=${timestamp},v1=${Array.from(mac, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
