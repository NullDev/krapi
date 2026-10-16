import type { KrunkerClient } from "../../client.js";
import type { KpdCall } from "../types.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/** player hacker reports; needs the `kpd` scope on the key */
export class KpdApi {
    readonly #client: KrunkerClient;

    constructor(client: KrunkerClient){
        this.#client = client;
    }

    /** GET /api/kpd/latest-calls, the 50 most recent calls newest first, no pagination */
    latestCalls(): Promise<KpdCall[]> {
        return this.#client.get("/api/kpd/latest-calls", { route: "kpd.latestCalls" });
    }
}
