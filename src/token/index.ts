import { KrunkerClient, type ClientOptions } from "../client.js";
import { GAPI_URL, LEGACY_API_URL } from "../game/envelope.js";
import { bearer, decodeToken, type TokenClaims } from "../jwt.js";
import { TokenCreatorApi } from "./resources/creator.js";
import { TokenMarketApi } from "./resources/market.js";
import { TokenPlayerApi } from "./resources/player.js";
import { TokenRankedApi } from "./resources/ranked.js";
import { TokenShopApi } from "./resources/shop.js";
import { TokenStaffApi } from "./resources/staff.js";
import { TokenTradesApi } from "./resources/trades.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/** options of the token tier: everything of ClientOptions but the key, the token replaces it */
export type TokenApiOptions = Omit<ClientOptions, "apiKey" | "baseUrl">;

/** the token bound resources plus the token's claims; made by Krunker.as(token) */
export class TokenSession {
    /** who the token belongs to, the key to cache anything read here under */
    readonly claims: TokenClaims;
    readonly player: TokenPlayerApi;
    readonly market: TokenMarketApi;
    readonly trades: TokenTradesApi;
    readonly shop: TokenShopApi;
    readonly creator: TokenCreatorApi;
    readonly staff: TokenStaffApi;
    readonly ranked: TokenRankedApi;

    constructor(gapi: KrunkerClient, legacy: KrunkerClient, token: string, claims: TokenClaims){
        const auth = bearer(token);
        this.claims = claims;
        this.player = new TokenPlayerApi(gapi, auth);
        this.market = new TokenMarketApi(gapi, auth);
        this.trades = new TokenTradesApi(gapi, auth);
        this.shop = new TokenShopApi(gapi, auth);
        this.creator = new TokenCreatorApi(gapi, auth);
        this.staff = new TokenStaffApi(gapi, auth);
        this.ranked = new TokenRankedApi(legacy, auth);
    }
}

/** reads that need the player's frvr access token (FRVR.auth.getFreshAccessToken() in the game). the token is only ever
 * sent as a bearer header, never stored or logged; every write of the game api is left out on purpose */
export class KrunkerTokenApi {
    readonly #gapi: KrunkerClient;
    readonly #legacy: KrunkerClient;

    constructor(options: TokenApiOptions = {}){
        this.#gapi = new KrunkerClient({ ...options, baseUrl: GAPI_URL });
        this.#legacy = new KrunkerClient({ ...options, baseUrl: LEGACY_API_URL });
    }

    /** the resources bound to one token; throws KrunkerTokenError before any request when the token is not a live jwt */
    as(token: string): TokenSession {
        return new TokenSession(this.#gapi, this.#legacy, token, decodeToken(token));
    }
}
