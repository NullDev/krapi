import { KrunkerClient, type ClientOptions } from "../client.js";
import type { RateLimitState } from "../rateLimit.js";
import { ClanApi } from "./resources/clan.js";
import { LeaderboardApi } from "./resources/leaderboard.js";
import { MapApi } from "./resources/map.js";
import { MarketApi } from "./resources/market.js";
import { MatchApi } from "./resources/match.js";
import { ModsApi } from "./resources/mods.js";
import { PlayerApi } from "./resources/player.js";
import { SkinsApi } from "./resources/skins.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

export type { MatchesQuery } from "./resources/player.js";
export type { RankedQuery } from "./resources/leaderboard.js";
export type { MapLeaderboardQuery } from "./resources/map.js";
export { MAX_HISTORY_DAYS, type MarketSkinQuery } from "./resources/market.js";
export { MAX_SKINS_PER_PAGE, type SkinsQuery } from "./resources/skins.js";

/** the documented developer api; one key is one rate limit window, so keep one instance per key */
export class KrunkerDeveloperApi {
    readonly player: PlayerApi;
    readonly match: MatchApi;
    readonly clan: ClanApi;
    readonly leaderboard: LeaderboardApi;
    readonly map: MapApi;
    readonly mods: ModsApi;
    readonly market: MarketApi;
    readonly skins: SkinsApi;
    readonly #client: KrunkerClient;

    constructor(options: ClientOptions = {}){
        // an undefined key means keyless for the client, here it means not configured
        this.#client = new KrunkerClient({ ...options, apiKey: options.apiKey ?? "" });
        this.player = new PlayerApi(this.#client);
        this.match = new MatchApi(this.#client);
        this.clan = new ClanApi(this.#client);
        this.leaderboard = new LeaderboardApi(this.#client);
        this.map = new MapApi(this.#client);
        this.mods = new ModsApi(this.#client);
        this.market = new MarketApi(this.#client);
        this.skins = new SkinsApi(this.#client);
    }

    /** false without an api key, every call throws KrunkerConfigError then */
    get configured(): boolean {
        return this.#client.configured;
    }

    /** what the last replies said about the key's window, for a health or admin view */
    rateLimit(): RateLimitState {
        return this.#client.rateLimit.snapshot();
    }
}
