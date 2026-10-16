import type { KrunkerClient } from "../../client.js";
import * as check from "../../validate.js";
import type { Page, RankedLeaderboard, RegionId } from "../types.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/** page and season of the ranked leaderboard */
export type RankedQuery = Page & {
    /** season number, current season when omitted or 0 */
    season?: number;
};

/** GET /api/leaderboard/*: the ranked leaderboard per region */
export class LeaderboardApi {
    readonly #client: KrunkerClient;

    constructor(client: KrunkerClient){
        this.#client = client;
    }

    /** GET /api/leaderboard/:region, 10 per page, mmr descending, players with 6+ placements only */
    ranked(region: RegionId, query: RankedQuery = {}): Promise<RankedLeaderboard> {
        return this.#client.get(`/api/leaderboard/${check.int(region, "region", 0)}`, {
            route: "leaderboard.ranked",
            query: { page: check.page(query.page), season: check.optionalInt(query.season, "season", 0) },
        });
    }
}
