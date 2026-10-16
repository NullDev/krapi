import { KrunkerClient, type ClientOptions } from "../client.js";
import { GAPI_URL, LEGACY_API_URL, MATCHMAKER_URL } from "./envelope.js";
import { PublicClansApi } from "./resources/clans.js";
import { PublicGameApi } from "./resources/game.js";
import { PublicItemsApi } from "./resources/items.js";
import { PublicLeaderboardsApi } from "./resources/leaderboards.js";
import { PublicLegacyApi } from "./resources/legacy.js";
import { PublicMarketApi } from "./resources/market.js";
import { PublicMatchmakerApi } from "./resources/matchmaker.js";
import { PublicPlayersApi } from "./resources/players.js";
import { PublicShopApi } from "./resources/shop.js";
import { PublicSocialApi } from "./resources/social.js";
import { PublicTurfApi } from "./resources/turf.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

export { GAPI_URL, LEGACY_API_URL, MATCHMAKER_URL } from "./envelope.js";
export { TURF_EPOCH_UTC, TURF_MAPS, turfDay, type DayMapQuery } from "./resources/turf.js";
export type { RecruitmentQuery } from "./resources/clans.js";
export type { CommunityLeaderboardQuery } from "./resources/game.js";
export type { BrowserQuery } from "./resources/legacy.js";
export { RAID_MAPS, type PlayerLeaderboardQuery } from "./resources/leaderboards.js";

export type GameOptions = Omit<ClientOptions, "apiKey" | "baseUrl">;

/** what the game reads without any auth: no key, no documented limits, shapes from live replies; reads only */
export class KrunkerGameApi {
    readonly players: PublicPlayersApi;
    readonly clans: PublicClansApi;
    readonly turf: PublicTurfApi;
    readonly leaderboards: PublicLeaderboardsApi;
    readonly game: PublicGameApi;
    readonly shop: PublicShopApi;
    readonly market: PublicMarketApi;
    readonly items: PublicItemsApi;
    readonly social: PublicSocialApi;
    readonly matchmaker: PublicMatchmakerApi;
    readonly legacy: PublicLegacyApi;

    constructor(options: GameOptions = {}){
        const gapi = new KrunkerClient({ ...options, baseUrl: GAPI_URL });
        this.players = new PublicPlayersApi(gapi);
        this.clans = new PublicClansApi(gapi);
        this.turf = new PublicTurfApi(gapi);
        this.leaderboards = new PublicLeaderboardsApi(gapi);
        this.game = new PublicGameApi(gapi);
        this.shop = new PublicShopApi(gapi);
        this.market = new PublicMarketApi(gapi);
        this.items = new PublicItemsApi(gapi);
        this.social = new PublicSocialApi(gapi);
        this.matchmaker = new PublicMatchmakerApi(new KrunkerClient({ ...options, baseUrl: MATCHMAKER_URL }));
        this.legacy = new PublicLegacyApi(new KrunkerClient({ ...options, baseUrl: LEGACY_API_URL }));
    }
}
