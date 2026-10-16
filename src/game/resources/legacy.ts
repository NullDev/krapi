import type { KrunkerClient } from "../../client.js";
import * as check from "../../validate.js";
import type { ItemPrices, LegacyMapList, LegacyModList, TopStreams } from "../types.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/** category tab (index) and page (pos) of the legacy map and mod browsers, 0 based */
export type BrowserQuery = { index?: number; pos?: number };

/** api.krunker.io, the old rest api; only the paths the page calls without a token */
export class PublicLegacyApi {
    readonly #client: KrunkerClient;

    constructor(client: KrunkerClient){
        this.#client = client;
    }

    /** GET /webhooks/general/maps/list, the community map browser; index is the category tab, pos the page */
    mapsList(query: BrowserQuery = {}): Promise<LegacyMapList> {
        return this.#client.get<LegacyMapList>("/webhooks/general/maps/list", {
            route: "game.legacy.mapsList",
            query: { index: check.optionalInt(query.index, "index", 0) ?? 0, pos: check.optionalInt(query.pos, "pos", 0) ?? 0 },
        });
    }

    /** GET /webhooks/general/mods/list, the mod browser */
    modsList(query: BrowserQuery = {}): Promise<LegacyModList> {
        return this.#client.get<LegacyModList>("/webhooks/general/mods/list", {
            route: "game.legacy.modsList",
            query: { index: check.optionalInt(query.index, "index", 0) ?? 0, pos: check.optionalInt(query.pos, "pos", 0) ?? 0 },
        });
    }

    /** GET /webhooks/general/items/prices, the kr value per skin index the inventory shows (38 KB) */
    itemPrices(): Promise<ItemPrices> {
        return this.#client.get<ItemPrices>("/webhooks/general/items/prices", { route: "game.legacy.itemPrices" });
    }

    /** GET /streams/top, the menu's stream box plus the running drop campaigns */
    async topStreams(): Promise<TopStreams> {
        const body = await this.#client.get<{ data: TopStreams }>("/streams/top", { route: "game.legacy.topStreams", query: { cb: 2 } });
        return body.data;
    }
}
