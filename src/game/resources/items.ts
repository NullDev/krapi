import type { KrunkerClient } from "../../client.js";
import * as check from "../../validate.js";
import { unwrap } from "../envelope.js";
import type { Envelope, ItemInstance, ItemSale, ItemView } from "../types.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/** the item page of the social market, by skin index */
export class PublicItemsApi {
    readonly #gapi: KrunkerClient;

    constructor(gapi: KrunkerClient){
        this.#gapi = gapi;
    }

    /** GET /items/:id/view, the whole order book of the skin plus stats, two weeks of daily sales and the top 100 owners */
    view(skinIndex: number): Promise<ItemView> {
        return unwrap(this.#gapi.get<Envelope<ItemView>>(`/items/${check.int(skinIndex, "skinIndex", 0)}/view`, { route: "game.items.view" }));
    }

    /** GET /items/:id/sales, one row per day; range is what the item page sends (6) */
    sales(skinIndex: number, range = 6): Promise<ItemSale[]> {
        return unwrap(this.#gapi.get<Envelope<ItemSale[]>>(`/items/${check.int(skinIndex, "skinIndex", 0)}/sales`, {
            route: "game.items.sales",
            query: { range: check.int(range, "range", 0) },
        }));
    }

    /** GET /items/:id/instances, the mints and wear tabs: non stackable skins only, at most 100 rows, no paging; sort is "mint" or "wear" */
    instances(skinIndex: number, sort = "mint"): Promise<ItemInstance[]> {
        return unwrap(this.#gapi.get<Envelope<ItemInstance[]>>(`/items/${check.int(skinIndex, "skinIndex", 0)}/instances`, {
            route: "game.items.instances",
            query: { sort: check.text(sort, "sort") },
        }));
    }
}
