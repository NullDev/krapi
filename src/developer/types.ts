// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //


/** ranked region ids as the leaderboard endpoint takes them */
export const Region = {
    ASIA: 2,
    EUROPE: 3,
    NORTH_AMERICA: 4,
} as const;
/** a ranked region id, one of Region or a number the api knows */
export type RegionId = typeof Region[keyof typeof Region] | number;

/** which built in board a map has: score or time */
export type LeaderboardType = "score" | "time";
/** 0 = ascending (lower is better), 1 = descending */
export type LeaderboardOrder = 0 | 1;
/** 1 = win, 0 = loss, -1 = draw */
export type MatchResult = 1 | 0 | -1;

/** the page query every paged developer endpoint takes, 1 based */
export type Page = { page?: number };

/** a player's ranked stats in one region this season */
export type PlayerRanked = {
    region: number;
    mmr: number;
    wins: number;
    losses: number;
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    damage_done: number;
    time_played: number;
};

/** GET /api/player/:name */
export type PlayerProfile = {
    player_id: number;
    player_name: string;
    /** empty when not in a clan */
    clan: string;
    verified: boolean;
    flag: number;
    badges: number[];
    following: number;
    followers: number;
    /** one entry per region with 6+ placement matches this season */
    ranked: PlayerRanked[];
    kr: number;
    level: number;
    junk: number;
    inventory: number;
    score: number;
    spk: number;
    kills: number;
    deaths: number;
    kdr: number;
    kpg: number;
    games: number;
    wins: number;
    losses: number;
    assists: number;
    melees: number;
    beatdowns: number;
    bullseyes: number;
    headshots: number;
    legshots: number;
    wallbangs: number;
    shots: number;
    hits: number;
    misses: number;
    time_played: number;
    nukes: number;
    airdrops: number;
    airdrops_stolen: number;
    slimes: number;
    juggernauts: number;
    juggernauts_killed: number;
    warmachines: number;
    /** undocumented: class id -> score with that class */
    class_stats: Record<string, number>;
    hacker_tagged: boolean;
    kpd: boolean;
    premium: boolean;
    /** undocumented, empty when not linked */
    twitch_name: string;
    /** empty when not premium */
    profile_picture: string;
    created_at: string;
    /** undocumented, only seen empty so far */
    maps: unknown[];
    /** undocumented, only seen empty so far */
    mods: unknown[];
};

/** one entry of GET /api/player/:name/inventory */
export type InventoryItem = {
    skin_index: number;
    /** undocumented: id of the owned item, not the definition */
    skin_id: number;
    /** excludes market listings */
    count: number;
    /** undocumented */
    metadata: unknown | null;
    /** undocumented */
    stackable: boolean;
};

/** one of a player's active market listings */
export type PlayerListing = {
    skin_index: number;
    price: number;
    listed_at: string;
};

/** GET /api/player/:name/listings, 10 per page */
export type PlayerListings = {
    page: number;
    per_page: number;
    listings: PlayerListing[];
};

/** one ranked match from a player's point of view */
export type PlayerMatch = {
    match_id: number;
    date: string;
    map: number;
    duration: number;
    season: number;
    region: number;
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    damage_done: number;
    headshots: number;
    accuracy: number;
    objective_score: number;
    kr: number;
    victory: MatchResult;
    rounds_won: number;
    team: number;
    /** milliseconds */
    play_time: number;
    /** rating after this match */
    mmr: number;
};

/** GET /api/player/:name/matches, 10 per page */
export type PlayerMatches = {
    page: number;
    per_page: number;
    matches: PlayerMatch[];
};

/** one social post of a player */
export type PlayerPost = {
    date: string;
    text: string;
    votes: number;
    comment_count: number;
};

/** GET /api/player/:name/posts, 10 per page */
export type PlayerPosts = {
    page: number;
    per_page: number;
    posts: PlayerPost[];
};

/** one player of a ranked match */
export type MatchParticipant = {
    player_name: string;
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    damage_done: number;
    headshots: number;
    accuracy: number;
    objective_score: number;
    victory: MatchResult;
    rounds_won: number;
    team: number;
    play_time: number;
};

/** GET /api/match/:id */
export type MatchDetails = {
    match_id: number;
    date: string;
    map: number;
    duration: number;
    season: number;
    region: number;
    /** ordered by team, then score descending */
    participants: MatchParticipant[];
};

/** GET /api/clan/:name */
export type ClanProfile = {
    name: string;
    owner_name: string;
    score: number;
    rank: number;
    member_count: number;
    created_at: string;
    /** discord invite code, empty when not set */
    discord: string;
};

/** one row of a clan's member list */
export type ClanMember = {
    player_name: string;
    role: number;
    verified: boolean;
    /** undocumented */
    score: number;
};

/** GET /api/clan/:name/members, 10 per page */
export type ClanMembers = {
    page: number;
    per_page: number;
    members: ClanMember[];
};

/** one row of the ranked leaderboard */
export type LeaderboardEntry = {
    position: number;
    player_name: string;
    mmr: number;
    wins: number;
    losses: number;
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    damage_done: number;
};

/** GET /api/leaderboard/:region, 10 per page */
export type RankedLeaderboard = {
    page: number;
    per_page: number;
    season: number;
    region: number;
    entries: LeaderboardEntry[];
};

/** GET /api/map/:name */
export type MapInfo = {
    map_id: number;
    name: string;
    description: string;
    creator_name: string;
    votes: number;
    gameplays: number;
    /** milliseconds */
    playtime: number;
    category: number;
    /** "YYYY-MM-DD HH:MM:SS", not rfc3339 like the docs say */
    created_at: string;
    updated_at: string;
    /** "time", "score" or empty when the map has no leaderboard */
    leaderboard_type: LeaderboardType | "";
    leaderboard_order: LeaderboardOrder;
    /** undocumented */
    featured: boolean;
};

/** one featured map */
export type FeaturedMap = {
    map_id: number;
    name: string;
    creator_id: number;
    creator_name: string;
};

/** GET /api/maps/featured */
export type FeaturedMaps = {
    maps: FeaturedMap[];
    count: number;
};

/** one row of a map leaderboard */
export type MapLeaderboardEntry = {
    position: number;
    player_name: string;
    value: number;
    date: string;
};

/** GET /api/map/:name/leaderboard, 25 per page */
export type MapLeaderboard = {
    page: number;
    per_page: number;
    map_name: string;
    leaderboard_type: LeaderboardType | "";
    leaderboard_order: LeaderboardOrder;
    entries: MapLeaderboardEntry[];
};

/** GET /api/map/:name/leaderboard/player/:player, one player's entry */
export type MapLeaderboardPlayer = {
    map_name: string;
    leaderboard_type: LeaderboardType;
    leaderboard_order: LeaderboardOrder;
    player_name: string;
    position: number;
    value: number;
    date: string;
};

/** GET /api/mods/:name */
export type Mod = {
    mod_id: number;
    name: string;
    description: string;
    creator_name: string;
    votes: number;
    featured: boolean;
    version: number;
    /** "YYYY-MM-DD HH:MM:SS", not rfc3339 like the docs say */
    created_at: string;
    updated_at: string;
};

/** GET /api/mods, 10 per page */
export type Mods = {
    page: number;
    per_page: number;
    mods: Mod[];
};

/** one active listing of a skin on the market */
export type MarketListing = {
    price: number;
    seller_name: string;
    listed_at: string;
};

/** one owner in a skin's top owners */
export type MarketOwner = {
    player_name: string;
    count: number;
};

/** one day of a skin's price history */
export type PricePoint = {
    /** YYYY-MM-DD */
    date: string;
    average_price: number;
    sales: number;
};

/** GET /api/market/skin/:skinindex */
export type MarketSkin = {
    skin_index: number;
    total_listings: number;
    /** 0 without listings */
    lowest_price: number;
    /** sales of the last 7 days */
    average_price: number;
    total_circulating: number;
    /** page of active listings, cheapest first */
    listings: MarketListing[];
    /** up to 100, most owned first, banned users excluded */
    owners: MarketOwner[];
    /** only days with sales */
    price_history: PricePoint[];
};

/** extra config properties of a skin (creator, glow, frames, ...) get merged into the root, so the index signature is real */
export type SkinDefinition = {
    index: number;
    name: string;
    type: number;
    rarity: number;
    /** omitted when the skin has no weapon */
    weapon?: number;
    /** the season; the docs call this field season */
    seas?: number;
    /** undocumented, equals index on the single skin endpoint */
    id?: number;
    /** undocumented */
    thumbnail?: string;
    /** undocumented */
    tradable?: boolean;
} & Record<string, unknown>;

/** GET /api/skins, paged skin definitions */
export type Skins = {
    page: number;
    per_page: number;
    total: number;
    skins: SkinDefinition[];
};

/** body of every error reply */
export type ApiErrorBody = {
    error: string | { code?: string; message?: string };
    retry_after?: number;
};

/** 0 public, 1 ranked, 2 comp, 3 custom */
export type KpdCallContext = 0 | 1 | 2 | 3;
/** 1 not responded, 2 responded, 3 reviewed */
export type KpdCallStatus = 1 | 2 | 3;
/** 0 pending, 1 banned, 2 rejected */
export type KpdCallRating = 0 | 1 | 2;

/** one row of GET /api/kpd/latest-calls */
export type KpdCall = {
    id: number;
    /** rfc3339 utc */
    date: string;
    caller_id: number;
    caller_name: string;
    caller_score: number;
    caller_job_rating: number;
    /** correct calls of the reporter */
    caller_job_rating_positive: number;
    called_id: number;
    /** "guest" when unregistered */
    called_name: string;
    called_score: number;
    kdf_type: KpdCallContext;
    kdf_type_label: string;
    status: KpdCallStatus;
    status_label: string;
    rating: KpdCallRating;
    rating_label: string;
    /** 0 without one */
    officer_id: number;
    officer_name: string;
    /** last status change, rfc3339 utc */
    status_date: string;
    game_code: string;
    host: string;
    port: string;
    /** internal call token */
    token: string;
};

/** the types documented so far; a key only sees the types of the event scopes it holds */
export type EventType = "map.featured" | "map.unfeatured" | (string & {});

/** what an event is about, e.g. type "map" and the map id */
export type EventTarget = {
    type: string;
    id: number | string;
};

/** data of map.featured and map.unfeatured */
export type MapEventData = {
    map_id: number;
    map_name: string;
    creator: string;
};

/** one event of GET /api/events or of a webhook delivery */
export type ApiEvent = {
    /** only ever increases, gaps are normal */
    id: number;
    type: EventType;
    /** rfc3339 utc */
    created_at: string;
    target: EventTarget;
    data: MapEventData | Record<string, unknown>;
};

/** GET /api/events */
export type EventsPage = {
    /** oldest first */
    events: ApiEvent[];
    /** pass as `after` on the next call, it also moves past events the filters skipped */
    next: number;
    has_more: boolean;
};

/** one webhook delivery; test and verify sends carry id 0, the real id is in the Krunker-Event-Id header */
export type WebhookEvent = Omit<ApiEvent, "type" | "data"> & {
    type: EventType | "webhook.test" | "webhook.verify";
    data: MapEventData | { nonce: string } | Record<string, unknown>;
};
