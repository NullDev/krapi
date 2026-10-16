import type { KrunkerClient } from "../../client.js";
import * as check from "../../validate.js";
import { unwrap } from "../envelope.js";
import type { Envelope, Lottery, ShopDisplay, SpinWheel } from "../types.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/** the shop's catalogue data; the wild offer and every purchase need the player's token */
export class PublicShopApi {
    readonly #gapi: KrunkerClient;

    constructor(gapi: KrunkerClient){
        this.#gapi = gapi;
    }

    /** GET /shop/displays/:id, display 1 is the front */
    display(displayId: number): Promise<ShopDisplay> {
        return unwrap(this.#gapi.get<Envelope<ShopDisplay>>(`/shop/displays/${check.int(displayId, "displayId", 1)}`, { route: "game.shop.display" }));
    }

    /** GET /shop/displays?tag=, "premium" is what the menu asks for; without a tag the api answers 400 */
    displayByTag(tag: string): Promise<ShopDisplay> {
        return unwrap(this.#gapi.get<Envelope<ShopDisplay>>("/shop/displays", { route: "game.shop.displayByTag", query: { tag: check.text(tag, "tag") } }));
    }

    /** GET /spins/wheels, every wheel with its item pools and weights */
    spinWheels(): Promise<SpinWheel[]> {
        return unwrap(this.#gapi.get<Envelope<SpinWheel[]>>("/spins/wheels", { route: "game.shop.spinWheels" }));
    }

    /** GET /lottery/:id, id 1 is the running one; player_entries is 0 without a token */
    lottery(lotteryId: number): Promise<Lottery> {
        return unwrap(this.#gapi.get<Envelope<Lottery>>(`/lottery/${check.int(lotteryId, "lotteryId", 1)}`, { route: "game.shop.lottery" }));
    }
}
