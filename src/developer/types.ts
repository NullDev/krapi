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
    /** Region ID */
    region: number;
    /** Matchmaking rating */
    mmr: number;
    /** Ranked wins in this region */
    wins: number;
    /** Ranked losses in this region */
    losses: number;
    /** Total kills in ranked matches */
    kills: number;
    /** Total deaths in ranked matches */
    deaths: number;
    /** Total assists in ranked matches */
    assists: number;
    /** Total score in ranked matches */
    score: number;
    /** Total damage dealt in ranked matches */
    damage_done: number;
    /** Total time played in ranked matches (seconds) */
    time_played: number;
};

/** GET /api/player/:name */
export type PlayerProfile = {
    /** Unique player identifier */
    player_id: number;
    /** Player's username */
    player_name: string;
    /** empty when not in a clan */
    clan: string;
    /** Whether the player is verified */
    verified: boolean;
    /** Player's country flag index */
    flag: number;
    /** Array of badge IDs the player has earned */
    badges: number[];
    /** Number of players this player is following */
    following: number;
    /** Number of players following this player */
    followers: number;
    /** one entry per region with 6+ placement matches this season */
    ranked: PlayerRanked[];
    /** Currency balance */
    kr: number;
    /** Calculated from score (0.03 × √score, min 1) */
    level: number;
    /** ELO/Junk rating */
    junk: number;
    /** Total skin value */
    inventory: number;
    /** Total score */
    score: number;
    /** Score per kill */
    spk: number;
    /** Total kills */
    kills: number;
    /** Total deaths */
    deaths: number;
    /** Kill/Death ratio */
    kdr: number;
    /** Kills per game */
    kpg: number;
    /** Games played */
    games: number;
    /** Games won */
    wins: number;
    /** Games lost (games - wins) */
    losses: number;
    /** Total assists */
    assists: number;
    /** Melee kills */
    melees: number;
    /** Fist kills */
    beatdowns: number;
    /** Thrown weapon kills */
    bullseyes: number;
    /** Headshot kills */
    headshots: number;
    /** Leg shot kills */
    legshots: number;
    /** Wallbang kills */
    wallbangs: number;
    /** Total shots fired */
    shots: number;
    /** Shots that connected */
    hits: number;
    /** Shots missed (shots - hits) */
    misses: number;
    /** Seconds played */
    time_played: number;
    /** Nukes called in */
    nukes: number;
    /** Airdrops called in */
    airdrops: number;
    /** Airdrops stolen from enemies */
    airdrops_stolen: number;
    /** Slimes called in */
    slimes: number;
    /** Juggernaut killstreaks earned */
    juggernauts: number;
    /** Enemy juggernauts killed */
    juggernauts_killed: number;
    /** Warmachines called in */
    warmachines: number;
    /** undocumented: class id -> score with that class */
    class_stats: Record<string, number>;
    /** Whether the player has been flagged as a cheater */
    hacker_tagged: boolean;
    /** Whether the player is a KPD moderator */
    kpd: boolean;
    /** Whether the player has an active premium subscription */
    premium: boolean;
    /** undocumented, empty when not linked */
    twitch_name: string;
    /** empty when not premium */
    profile_picture: string;
    /** Account creation date (RFC3339 format) */
    created_at: string;
    /** undocumented: maps the player voted on, only seen empty so far */
    maps: VotedItem[];
    /** undocumented: mods the player voted on, only seen empty so far */
    mods: VotedItem[];
};

/** undocumented: a map or mod the player voted on, shape from the community wrapper */
export type VotedItem = {
    id: number;
    name: string;
    votes: number;
};

/** undocumented: kounter stats and float data of one owned skin, every field optional; shape from the community wrapper */
export type InventoryItemMetadata = {
    wear?: number;
    style?: number;
    serial?: number;
    kills?: number;
    hskills?: number;
    headshots?: number;
    hits?: number;
    shots?: number;
    jumps?: number;
};

/** one entry of GET /api/player/:name/inventory */
export type InventoryItem = {
    /** Identifier for the skin */
    skin_index: number;
    /** undocumented: id of the owned item, not the definition */
    skin_id: number;
    /** excludes market listings */
    count: number;
    /** undocumented, null without any */
    metadata: InventoryItemMetadata | null;
    /** undocumented */
    stackable: boolean;
};

/** one of a player's active market listings */
export type PlayerListing = {
    /** Identifier for the skin being sold */
    skin_index: number;
    /** Listing price in KR */
    price: number;
    /** When the listing was created */
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
    /** Unique match identifier */
    match_id: number;
    /** Match date (RFC3339 format) */
    date: string;
    /** Map ID */
    map: number;
    /** Match duration in seconds */
    duration: number;
    /** Ranked season number */
    season: number;
    /** Region ID */
    region: number;
    /** Player's kills in this match */
    kills: number;
    /** Player's deaths in this match */
    deaths: number;
    /** Player's assists in this match */
    assists: number;
    /** Player's score in this match */
    score: number;
    /** Player's damage dealt in this match */
    damage_done: number;
    /** Player's headshots in this match */
    headshots: number;
    /** Player's accuracy percentage */
    accuracy: number;
    /** Player's objective score */
    objective_score: number;
    /** KR earned from this match */
    kr: number;
    /** Match result (1 = win, 0 = loss, -1 = draw) */
    victory: MatchResult;
    /** Rounds won by player's team */
    rounds_won: number;
    /** Player's team number */
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
    /** null when the page is past the end */
    matches: PlayerMatch[] | null;
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
    /** Player's kills in this match */
    kills: number;
    /** Player's deaths in this match */
    deaths: number;
    /** Player's assists in this match */
    assists: number;
    /** Player's score in this match */
    score: number;
    /** Player's damage dealt in this match */
    damage_done: number;
    /** Player's headshots in this match */
    headshots: number;
    /** Player's accuracy percentage */
    accuracy: number;
    /** Player's objective score */
    objective_score: number;
    /** Match result (1 = win, 0 = loss, -1 = draw) */
    victory: MatchResult;
    /** Rounds won by player's team */
    rounds_won: number;
    /** Player's team number */
    team: number;
    /** milliseconds */
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
    /** Clan name */
    name: string;
    /** Name of the clan owner */
    owner_name: string;
    /** Clan's total score */
    score: number;
    /** Clan's leaderboard rank */
    rank: number;
    /** Number of members in the clan */
    member_count: number;
    /** Clan creation date */
    created_at: string;
    /** discord invite code, empty when not set */
    discord: string;
};

/** one row of a clan's member list */
export type ClanMember = {
    /** Member's username */
    player_name: string;
    /** Member's role in the clan */
    role: number;
    /** Whether the player is verified */
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
    /** Leaderboard position */
    position: number;
    /** Player's username */
    player_name: string;
    /** Matchmaking rating */
    mmr: number;
    /** Total ranked wins */
    wins: number;
    /** Total ranked losses */
    losses: number;
    /** Total kills in ranked matches */
    kills: number;
    /** Total deaths in ranked matches */
    deaths: number;
    /** Total assists in ranked matches */
    assists: number;
    /** Total score in ranked matches */
    score: number;
    /** Total damage dealt in ranked matches */
    damage_done: number;
};

/** GET /api/leaderboard/:region, 10 per page */
export type RankedLeaderboard = {
    /** Current page number */
    page: number;
    /** Number of entries per page (10) */
    per_page: number;
    /** Current ranked season */
    season: number;
    /** Region ID */
    region: number;
    /** Array of leaderboard entries */
    entries: LeaderboardEntry[];
};

/** GET /api/map/:name */
export type MapInfo = {
    /** Unique map identifier */
    map_id: number;
    /** Map name */
    name: string;
    /** Map description */
    description: string;
    /** Username of the map creator */
    creator_name: string;
    /** Total upvotes */
    votes: number;
    /** Number of times the map has been played */
    gameplays: number;
    /** milliseconds */
    playtime: number;
    /** Map category ID */
    category: number;
    /** "YYYY-MM-DD HH:MM:SS", not rfc3339 like the docs say */
    created_at: string;
    /** When the map was last updated */
    updated_at: string;
    /** "time", "score" or empty when the map has no leaderboard */
    leaderboard_type: LeaderboardType | "";
    /** Sort order for leaderboard (0 = ascending/lower is better, 1 = descending/higher is better) */
    leaderboard_order: LeaderboardOrder;
    /** undocumented */
    featured: boolean;
};

/** one featured map */
export type FeaturedMap = {
    /** Unique map identifier */
    map_id: number;
    /** Map name */
    name: string;
    /** Player id of the map creator */
    creator_id: number;
    /** Username of the map creator */
    creator_name: string;
};

/** GET /api/maps/featured */
export type FeaturedMaps = {
    maps: FeaturedMap[];
    /** Number of maps returned */
    count: number;
};

/** one row of a map leaderboard */
export type MapLeaderboardEntry = {
    /** Leaderboard position */
    position: number;
    /** Player's username */
    player_name: string;
    /** Score or time value */
    value: number;
    /** When the entry was recorded */
    date: string;
};

/** GET /api/map/:name/leaderboard, 25 per page */
export type MapLeaderboard = {
    /** Current page number */
    page: number;
    /** Number of entries per page (25) */
    per_page: number;
    /** The map name queried */
    map_name: string;
    /** Type of leaderboard (e.g., "time", "score") */
    leaderboard_type: LeaderboardType | "";
    /** Sort order (0 = ascending, 1 = descending) */
    leaderboard_order: LeaderboardOrder;
    /** Array of leaderboard entries */
    entries: MapLeaderboardEntry[];
};

/** GET /api/map/:name/leaderboard/player/:player, one player's entry */
export type MapLeaderboardPlayer = {
    /** The map name queried */
    map_name: string;
    /** Type of leaderboard (e.g., "time", "score") */
    leaderboard_type: LeaderboardType;
    /** Sort order (0 = ascending, 1 = descending) */
    leaderboard_order: LeaderboardOrder;
    /** Player's username */
    player_name: string;
    /** Player's position on the leaderboard */
    position: number;
    /** Player's score or time value */
    value: number;
    /** When the entry was recorded */
    date: string;
};

/** GET /api/mods/:name */
export type Mod = {
    /** Unique mod identifier */
    mod_id: number;
    /** Mod name */
    name: string;
    /** Mod description */
    description: string;
    /** Username of the mod creator */
    creator_name: string;
    /** Number of upvotes */
    votes: number;
    /** Whether the mod is featured */
    featured: boolean;
    /** Mod version number */
    version: number;
    /** "YYYY-MM-DD HH:MM:SS", not rfc3339 like the docs say */
    created_at: string;
    /** When the mod was last updated (same format) */
    updated_at: string;
};

/** GET /api/mods, 10 per page */
export type Mods = {
    /** Current page number */
    page: number;
    /** Number of mods per page (10) */
    per_page: number;
    /** Array of mod objects */
    mods: Mod[];
};

/** one active listing of a skin on the market */
export type MarketListing = {
    /** Listing price in KR */
    price: number;
    /** Seller's username */
    seller_name: string;
    /** When the listing was created */
    listed_at: string;
};

/** one owner in a skin's top owners */
export type MarketOwner = {
    /** Owner's username */
    player_name: string;
    /** Number of this skin the player owns */
    count: number;
};

/** one day of a skin's price history */
export type PricePoint = {
    /** YYYY-MM-DD */
    date: string;
    /** Average sale price on that day */
    average_price: number;
    /** Number of sales on that day */
    sales: number;
};

/** GET /api/market/skin/:skinindex */
export type MarketSkin = {
    /** The skin index queried */
    skin_index: number;
    /** Total number of active listings */
    total_listings: number;
    /** 0 without listings */
    lowest_price: number;
    /** sales of the last 7 days */
    average_price: number;
    /** Total quantity of this skin in circulation */
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
    /** Skin index (ID) */
    index: number;
    /** Skin name */
    name: string;
    /** Skin type */
    type: number;
    /** Skin rarity */
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
    /** Current page number */
    page: number;
    /** Items per page */
    per_page: number;
    /** Total number of matching skins */
    total: number;
    /** Array of skin objects */
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
    /** Report id */
    id: number;
    /** rfc3339 utc */
    date: string;
    /** Reporter player id */
    caller_id: number;
    /** Reporter name */
    caller_name: string;
    /** Reporter score */
    caller_score: number;
    /** Reporter's total KPD job rating */
    caller_job_rating: number;
    /** correct calls of the reporter */
    caller_job_rating_positive: number;
    /** Reported player id */
    called_id: number;
    /** "guest" when unregistered */
    called_name: string;
    /** Reported player score */
    called_score: number;
    /** Call context: 0=public, 1=ranked, 2=comp, 3=custom */
    kdf_type: KpdCallContext;
    /** Readable kdf_type */
    kdf_type_label: string;
    /** 1=not responded, 2=responded, 3=reviewed */
    status: KpdCallStatus;
    /** Readable status */
    status_label: string;
    /** Officer verdict: 0=pending, 1=banned, 2=rejected */
    rating: KpdCallRating;
    /** Readable rating */
    rating_label: string;
    /** 0 without one */
    officer_id: number;
    /** Officer name */
    officer_name: string;
    /** last status change, rfc3339 utc */
    status_date: string;
    /** Game instance code */
    game_code: string;
    /** Game server host */
    host: string;
    /** Game server port */
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
