// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

export { Krunker, type KrunkerOptions } from "./krunker.js";
export { KrunkerDeveloperApi } from "./developer/index.js";
export { KrunkerGameApi, type GameApiOptions } from "./game/index.js";
export { KrunkerTokenApi, TokenSession, type TokenApiOptions } from "./token/index.js";

export * from "./errors.js";
export { decodeToken, type TokenClaims } from "./jwt.js";
export { DEFAULT_BASE_URL, KrunkerClient, type ClientOptions, type FetchLike, type Logger, type QueryValue, type RequestOptions } from "./client.js";
export { RateLimitTracker } from "./rateLimit.js";

// the resource classes, for the reference and for typing a resource you hand around
export { ClanApi } from "./developer/resources/clan.js";
export { EventsApi } from "./developer/resources/events.js";
export { KpdApi } from "./developer/resources/kpd.js";
export { LeaderboardApi } from "./developer/resources/leaderboard.js";
export { MapApi } from "./developer/resources/map.js";
export { MarketApi } from "./developer/resources/market.js";
export { MatchApi } from "./developer/resources/match.js";
export { ModsApi } from "./developer/resources/mods.js";
export { PlayerApi } from "./developer/resources/player.js";
export { SkinsApi } from "./developer/resources/skins.js";
export { PublicClansApi } from "./game/resources/clans.js";
export { PublicGameApi } from "./game/resources/game.js";
export { PublicItemsApi } from "./game/resources/items.js";
export { PublicLeaderboardsApi } from "./game/resources/leaderboards.js";
export { PublicLegacyApi } from "./game/resources/legacy.js";
export { PublicMarketApi } from "./game/resources/market.js";
export { PublicMatchmakerApi } from "./game/resources/matchmaker.js";
export { PublicPlayersApi } from "./game/resources/players.js";
export { PublicShopApi } from "./game/resources/shop.js";
export { PublicSocialApi } from "./game/resources/social.js";
export { PublicTurfApi } from "./game/resources/turf.js";
export { TokenCreatorApi } from "./token/resources/creator.js";
export { TokenMarketApi } from "./token/resources/market.js";
export { TokenPlayerApi } from "./token/resources/player.js";
export { TokenRankedApi } from "./token/resources/ranked.js";
export { TokenShopApi } from "./token/resources/shop.js";
export { TokenStaffApi } from "./token/resources/staff.js";
export { TokenTradesApi } from "./token/resources/trades.js";
export { GLOBAL_LIMIT, type RateLimitState, type RateLimitWindow } from "./rateLimit.js";

export * from "./developer/types.js";
export {
    MAX_EVENTS_PER_PAGE,
    MAX_EVENT_TARGETS,
    MAX_HISTORY_DAYS,
    MAX_SKINS_PER_PAGE,
    WEBHOOK_HEADERS,
    WEBHOOK_TOLERANCE_S,
    parseWebhookSignature,
    signWebhook,
    verifyWebhook,
    type EventsQuery,
    type MapLeaderboardQuery,
    type MarketSkinQuery,
    type MatchesQuery,
    type RankedQuery,
    type SkinsQuery,
    type VerifyWebhookOptions,
    type WebhookSignature,
} from "./developer/index.js";

export * from "./game/types.js";
export {
    GAPI_URL,
    LEGACY_API_URL,
    MATCHMAKER_URL,
    RAID_MAPS,
    TURF_EPOCH_UTC,
    TURF_MAPS,
    turfDay,
    type BrowserQuery,
    type CommunityLeaderboardQuery,
    type DayMapQuery,
    type PlayerLeaderboardQuery,
    type RecruitmentQuery,
} from "./game/index.js";

export * from "./token/types.js";
