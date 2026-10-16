import { KrunkerError } from "../errors.js";
import type { Envelope } from "./types.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/** gapi.svc.krunker.io, the game api and the developer api */
export const GAPI_URL = "https://gapi.svc.krunker.io";
/** matchmaker.krunker.io, the lobby list */
export const MATCHMAKER_URL = "https://matchmaker.krunker.io";
/** api.krunker.io, the old rest api and the ranked api */
export const LEGACY_API_URL = "https://api.krunker.io";

/** gapi wraps every reply in {data, error}; the game code checks error on a 2xx too */
export async function unwrap<T>(reply: Promise<Envelope<T>>): Promise<T> {
    const body = await reply;
    if (body.error !== null && body.error !== undefined){
        const message = typeof body.error === "string" ? body.error : body.error.message ?? body.error.code ?? "unknown error";
        throw new KrunkerError(`Krunker gapi error: ${message}`);
    }
    return body.data;
}
