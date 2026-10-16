import type { ClientOptions } from "./client.js";
import { KrunkerDeveloperApi } from "./developer/index.js";
import { KrunkerGameApi } from "./game/index.js";
import { KrunkerTokenApi, type TokenSession } from "./token/index.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/** options of Krunker: ClientOptions without baseUrl, every tier picks its own host */
export type KrunkerOptions = Omit<ClientOptions, "baseUrl">;

/**
 * the three krunker apis behind one object:
 * - the documented developer api on the root (`krunker.player`, `krunker.market`, ...), needs `apiKey`
 * - `krunker.game.*`, what the game itself reads without any auth
 * - `krunker.as(token).*`, what the game reads with the player's own frvr token
 */
export class Krunker extends KrunkerDeveloperApi {
    readonly game: KrunkerGameApi;
    readonly #token: KrunkerTokenApi;

    constructor(options: KrunkerOptions = {}){
        super(options);
        const { apiKey: _apiKey, ...shared } = options;
        this.game = new KrunkerGameApi(shared);
        this.#token = new KrunkerTokenApi(shared);
    }

    /** the endpoints bound to a player's token; throws KrunkerTokenError before any request when it is not a live jwt */
    as(token: string): TokenSession {
        return this.#token.as(token);
    }
}
