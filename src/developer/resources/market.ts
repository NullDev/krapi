import type { KrunkerClient } from "../../client.js";
import * as check from "../../validate.js";
import type { MarketSkin, Page } from "../types.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/** days of price history GET /api/market/skin/:skinindex can return */
export const MAX_HISTORY_DAYS = 120;

/** page of listings and days of price history for a market skin */
export type MarketSkinQuery = Page & {
    /** days of price history, 30 by default, 120 at most */
    days?: number;
};

/** GET /api/market/*: listings, owners and price history per skin */
export class MarketApi {
    readonly #client: KrunkerClient;

    constructor(client: KrunkerClient){
        this.#client = client;
    }

    /** GET /api/market/skin/:skinindex, listings 10 per page cheapest first */
    skin(skinIndex: number, query: MarketSkinQuery = {}): Promise<MarketSkin> {
        return this.#client.get(`/api/market/skin/${check.int(skinIndex, "skinIndex", 0)}`, {
            route: "market.skin",
            query: { page: check.page(query.page), days: check.optionalInt(query.days, "days", 1, MAX_HISTORY_DAYS) },
        });
    }
}
