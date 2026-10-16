import type { KrunkerClient } from "../../client.js";
import * as check from "../../validate.js";
import type { MatchDetails } from "../types.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

export class MatchApi {
    readonly #client: KrunkerClient;

    constructor(client: KrunkerClient){
        this.#client = client;
    }

    /** GET /api/match/:id, ranked matches only */
    get(matchId: number | string | bigint): Promise<MatchDetails> {
        return this.#client.get(`/api/match/${check.id(matchId, "matchId")}`, { route: "match.get" });
    }
}
