// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

export { Krunker, type KrunkerOptions } from "./krunker.js";
export { KrunkerDeveloperApi } from "./developer/index.js";
export { KrunkerGameApi, type GameOptions } from "./game/index.js";
export { KrunkerTokenApi, TokenSession, type TokenOptions } from "./token/index.js";

export * from "./errors.js";
export { decodeToken, type TokenClaims } from "./jwt.js";
export { DEFAULT_BASE_URL, type ClientOptions, type Logger } from "./client.js";
export { GLOBAL_LIMIT, type RateLimitState, type RateLimitWindow } from "./rateLimit.js";

export * from "./developer/types.js";
export {
    MAX_HISTORY_DAYS,
    MAX_SKINS_PER_PAGE,
    type MapLeaderboardQuery,
    type MarketSkinQuery,
    type MatchesQuery,
    type RankedQuery,
    type SkinsQuery,
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
