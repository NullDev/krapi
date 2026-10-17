import type { KrunkerClient } from "../../client.js";
import * as check from "../../validate.js";
import { unwrap } from "../envelope.js";
import type { Envelope, ItemSale, ItemSalesInfo, MarketStats, MarketStatsQuery } from "../types.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

const MAX_LIMIT = 100;

/** the market reads that answer without a token; listings, inventory and history need one (token wrapper) */
export class PublicMarketApi {
    readonly #gapi: KrunkerClient;

    constructor(gapi: KrunkerClient){
        this.#gapi = gapi;
    }

    /** GET /market/stats, 100 skins per page with circulation, on sale count and ask range */
    stats(query: MarketStatsQuery = {}): Promise<MarketStats> {
        return unwrap(this.#gapi.get<Envelope<MarketStats>>("/market/stats", {
            route: "game.market.stats",
            query: {
                cursor: check.optionalInt(query.cursor, "cursor", 0),
                limit: check.optionalInt(query.limit, "limit", 1, MAX_LIMIT),
                sort: query.sort,
                rarities: check.list(query.rarities),
                weapons: check.list(query.weapons),
                types: check.list(query.types),
                season: check.optionalInt(query.season, "season", 1),
                searchTerm: query.searchTerm,
            },
        }));
    }

    /** GET /market/items/:id/sales, ask range, circulation and the full owner id list (the daily rows are itemSalesStatistics) */
    itemSales(skinIndex: number): Promise<ItemSalesInfo> {
        return unwrap(this.#gapi.get<Envelope<ItemSalesInfo>>(`/market/items/${check.int(skinIndex, "skinIndex", 0)}/sales`, { route: "game.market.itemSales" }));
    }

    /** GET /market/items/:id/sales-statistics, one row per day with a sale */
    itemSalesStatistics(skinIndex: number, daysBack = 30): Promise<ItemSale[]> {
        return unwrap(this.#gapi.get<Envelope<ItemSale[]>>(`/market/items/${check.int(skinIndex, "skinIndex", 0)}/sales-statistics`, {
            route: "game.market.itemSalesStatistics",
            query: { daysback: check.int(daysBack, "daysBack", 1) },
        }));
    }
}
