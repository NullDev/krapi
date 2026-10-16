import { describe, expect, test } from "bun:test";
import { WEBHOOK_HEADERS, parseWebhookSignature, signWebhook, verifyWebhook } from "../src/index.js";

const SECRET = "whsec_test_secret";
const BODY = JSON.stringify({ id: 1042, type: "map.featured", created_at: "2026-10-10T19:30:12Z", target: { type: "map", id: 8497 }, data: { map_id: 8497, map_name: "Bhop_Ravine", creator: "someone" } });

/** what the docs' node:crypto example computes, to check our WebCrypto path against it */
const reference = async(rawBody: string, timestamp: number, secret: string): Promise<string> => {
    const { createHmac } = await import("node:crypto");
    return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
};

describe("webhooks", () => {
    test("parseWebhookSignature reads the documented form only", () => {
        expect(parseWebhookSignature("t=1760000000,v1=abcd")).toEqual({ timestamp: 1760000000, v1: "abcd" });
        expect(parseWebhookSignature(" t=1760000000 , v1=ABCD ")).toEqual({ timestamp: 1760000000, v1: "ABCD" });
        expect(parseWebhookSignature("v1=abcd")).toBeNull();
        expect(parseWebhookSignature("t=soon,v1=abcd")).toBeNull();
        expect(parseWebhookSignature("t=1760000000,v1=xyz")).toBeNull();
        expect(parseWebhookSignature("t=1760000000,v1=abc")).toBeNull();
        expect(parseWebhookSignature("")).toBeNull();
        expect(parseWebhookSignature(null)).toBeNull();
        expect(parseWebhookSignature(undefined)).toBeNull();
    });

    test("signWebhook matches the docs' reference implementation", async() => {
        const timestamp = 1760000000;
        expect(await signWebhook(BODY, SECRET, timestamp)).toBe(`t=${timestamp},v1=${await reference(BODY, timestamp, SECRET)}`);
    });

    test("verifyWebhook accepts a fresh, correctly signed delivery", async() => {
        const header = await signWebhook(BODY, SECRET);
        expect(await verifyWebhook(BODY, header, SECRET)).toBe(true);
        expect(await verifyWebhook(new TextEncoder().encode(BODY), header, SECRET)).toBe(true);
    });

    test("verifyWebhook rejects a wrong secret, a changed body, a bad header and an old timestamp", async() => {
        const header = await signWebhook(BODY, SECRET);
        expect(await verifyWebhook(BODY, header, "whsec_other")).toBe(false);
        expect(await verifyWebhook(BODY + " ", header, SECRET)).toBe(false);
        const flipped = header.slice(0, -1) + (header.endsWith("0") ? "1" : "0");
        expect(await verifyWebhook(BODY, flipped, SECRET)).toBe(false);
        expect(await verifyWebhook(BODY, null, SECRET)).toBe(false);
        expect(await verifyWebhook(BODY, header, "")).toBe(false);

        const old = Math.floor(Date.now() / 1000) - 301;
        expect(await verifyWebhook(BODY, await signWebhook(BODY, SECRET, old), SECRET)).toBe(false);
        expect(await verifyWebhook(BODY, await signWebhook(BODY, SECRET, old), SECRET, { toleranceS: 600 })).toBe(true);
        const future = Math.floor(Date.now() / 1000) + 301;
        expect(await verifyWebhook(BODY, await signWebhook(BODY, SECRET, future), SECRET)).toBe(false);
    });

    test("a signature of another body does not verify even with a matching length", async() => {
        const header = await signWebhook("{}", SECRET);
        expect(await verifyWebhook("[]", header, SECRET)).toBe(false);
    });

    test("the header names are the documented ones", () => {
        expect(WEBHOOK_HEADERS.signature).toBe("Krunker-Signature");
        expect(WEBHOOK_HEADERS.eventId).toBe("Krunker-Event-Id");
    });
});
