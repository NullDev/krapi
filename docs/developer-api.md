---
title: Developer API
description: The documented Krunker developer API, corrected against the live service
---

Base URL: https://gapi.svc.krunker.io

This is the developer API documentation as provided by Krunker (FRVR), with corrections from using it. Rows marked *undocumented* and notes marked *observed* were found by calling the endpoints in October 2026 and are not part of the original document; they may change without notice. The KPD, Events and Webhooks sections at the end were added later from a second document by Krunker; they are reproduced as documented and not verified, the key this document was checked with holds neither the `kpd` nor an events scope.

In krapi every endpoint below lives on the root of `Krunker` (`krunker.player.profile(...)`, `krunker.market.skin(...)`). The endpoints the game reads without a key are in [game-api.md](game-api.md) and the ones bound to a player token in [token-api.md](token-api.md).

> **Observed:**
>
> - 404 replies carry the plain text body `Not Found`, not the `{"error": ...}` json documented below.
> - Player, clan and map name lookups are case-insensitive (`Burg` and `burg` return the same map, named `burg`).
> - `GET /api/market/skin/:skinindex` is the slow endpoint: over 10 s cold, 2.7 s warm for skin 1. Everything else answered in 0.2 to 0.7 s.
> - Rate limit window observed: 240 per key, `X-RateLimit-Reset` a unix timestamp about 60 s ahead. The keyless gapi paths send their own headers: limit 5 per route per second with a *relative* `X-RateLimit-Reset` (seconds). krapi tells the two apart by the value's size.

## Developer APIs

The Developer APIs provide read-only access to public game data for third-party integrations.

## Authentication

All developer API endpoints require the `X-Developer-API-Key` header.

```text
X-Developer-API-Key: <your-api-key>
```

**Error Response (403 Forbidden):**

```json
{
  "error": "Not allowed."
}
```

## Rate Limiting

All endpoints are rate-limited to **240 requests per minute** per API key. Some endpoints have a lower limit of their own on top (`GET /api/events`: 6 per minute).

**Rate Limit Headers:**

Every response includes headers to help you track your usage:

| Header | Description |
| --- | --- |
| `X-RateLimit-Limit` | Maximum requests allowed per window (240, or the endpoint's own limit) |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp when the rate limit resets |

**Rate Limit Exceeded Response (429 Too Many Requests):**

```json
{
  "error": "Rate limit exceeded",
  "retry_after": 45
}
```

| Field | Type | Description |
| --- | --- | --- |
| error | string | Error message |
| retry_after | int | Seconds until the rate limit resets |

---

## Player Endpoints

### Get Player Profile

Retrieve comprehensive player statistics and profile information.

```http
GET /api/player/:playername
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| playername | string | path | yes | The player's in-game username |

**Response:**

```json
{
  "player_id": 11443974,
  "player_name": "string",
  "clan": "string",
  "verified": true,
  "flag": 5,
  "badges": [1, 2, 3],
  "following": 50,
  "followers": 100,
  "ranked": [
    {
      "region": 0,
      "mmr": 2250,
      "wins": 45,
      "losses": 30,
      "kills": 800,
      "deaths": 500,
      "assists": 200,
      "score": 15000,
      "damage_done": 120000,
      "time_played": 36000
    }
  ],
  "kr": 1000,
  "level": 50,
  "junk": 1500.5,
  "inventory": 25000,
  "score": 1000000,
  "spk": 125.5,
  "kills": 8000,
  "deaths": 4000,
  "kdr": 2.0,
  "kpg": 10.5,
  "games": 760,
  "wins": 400,
  "losses": 360,
  "assists": 1200,
  "melees": 150,
  "beatdowns": 50,
  "bullseyes": 30,
  "headshots": 3000,
  "legshots": 500,
  "wallbangs": 200,
  "shots": 100000,
  "hits": 45000,
  "misses": 55000,
  "time_played": 360000,
  "nukes": 25,
  "airdrops": 150,
  "airdrops_stolen": 30,
  "slimes": 40,
  "juggernauts": 20,
  "juggernauts_killed": 15,
  "warmachines": 10,
  "hacker_tagged": false,
  "kpd": false,
  "premium": true,
  "profile_picture": "https://user-assets.krunker.io/p11443974/profile.png",
  "created_at": "2021-05-10T14:30:00Z"
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| player_id | int | Unique player identifier |
| player_name | string | Player's username |
| clan | string | Player's clan name (empty string if not in a clan) |
| verified | bool | Whether the player is verified |
| flag | int | Player's country flag index |
| badges | int\[\] | Array of badge IDs the player has earned |
| following | int | Number of players this player is following |
| followers | int | Number of players following this player |
| ranked | object\[\] | Array of ranked profiles for the current season, one per region (only includes regions where player has completed 6+ placement matches) |
| ranked\[\].region | int | Region ID |
| ranked\[\].mmr | int | Matchmaking rating |
| ranked\[\].wins | int | Ranked wins in this region |
| ranked\[\].losses | int | Ranked losses in this region |
| ranked\[\].kills | int | Total kills in ranked matches |
| ranked\[\].deaths | int | Total deaths in ranked matches |
| ranked\[\].assists | int | Total assists in ranked matches |
| ranked\[\].score | int | Total score in ranked matches |
| ranked\[\].damage_done | int | Total damage dealt in ranked matches |
| ranked\[\].time_played | int | Total time played in ranked matches (seconds) |
| kr | int | Currency balance |
| level | int | Calculated from score (0.03 × √score, min 1) |
| junk | float | ELO/Junk rating |
| inventory | int | Total skin value |
| score | int | Total score |
| spk | float | Score per kill |
| kills | int | Total kills |
| deaths | int | Total deaths |
| kdr | float | Kill/Death ratio |
| kpg | float | Kills per game |
| games | int | Games played |
| wins | int | Games won |
| losses | int | Games lost (games - wins) |
| assists | int | Total assists |
| melees | int | Melee kills |
| beatdowns | int | Fist kills |
| bullseyes | int | Thrown weapon kills |
| headshots | int | Headshot kills |
| legshots | int | Leg shot kills |
| wallbangs | int | Wallbang kills |
| shots | int | Total shots fired |
| hits | int | Shots that connected |
| misses | int | Shots missed (shots - hits) |
| time_played | int64 | Seconds played |
| nukes | int | Nukes called in |
| airdrops | int | Airdrops called in |
| airdrops_stolen | int | Airdrops stolen from enemies |
| slimes | int | Slimes called in |
| juggernauts | int | Juggernaut killstreaks earned |
| juggernauts_killed | int | Enemy juggernauts killed |
| warmachines | int | Warmachines called in |
| class_stats | object | *undocumented* - class id (string) to score with that class, e.g. `{"0": 236755, "1": 20644276}` |
| hacker_tagged | bool | Whether the player has been flagged as a cheater |
| kpd | bool | Whether the player is a KPD moderator |
| premium | bool | Whether the player has an active premium subscription |
| twitch_name | string | *undocumented* - linked Twitch name, empty string if none |
| profile_picture | string | Profile picture URL (empty string if not premium) |
| created_at | string | Account creation date (RFC3339 format) |
| maps | array | *undocumented* - only seen as `[]` so far, shape unknown |
| mods | array | *undocumented* - only seen as `[]` so far, shape unknown |

---

### Get Player Inventory

Retrieve a player's skin inventory.

```http
GET /api/player/:playername/inventory
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| playername | string | path | yes | The player's in-game username |

**Response:**

```json
[
  {
    "skin_index": 123,
    "count": 5
  }
]
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| skin_index | int | Identifier for the skin |
| skin_id | int | *undocumented* - id of the owned item instance (not the definition) |
| count | int | Number owned (excludes market listings) |
| metadata | any | *undocumented* - only seen as `null` so far |
| stackable | bool | *undocumented* |

---

### Get Player Listings

Retrieve a player's active market listings (paginated).

```http
GET /api/player/:playername/listings
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| playername | string | path | yes | The player's in-game username |
| page | int | query | no | Page number (default: 1) |

**Response:**

```json
{
  "page": 1,
  "per_page": 10,
  "listings": [
    {
      "skin_index": 123,
      "price": 5000,
      "listed_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| skin_index | int | Identifier for the skin being sold |
| price | int | Listing price in KR |
| listed_at | string | When the listing was created |

**Notes:**

- Only active listings are returned
- Page size is fixed at 10 records
- Listings are ordered by date listed (newest first)

---

### Get Player Match History

Retrieve a player's ranked match history (paginated).

```http
GET /api/player/:playername/matches
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| playername | string | path | yes | The player's in-game username |
| page | int | query | no | Page number (default: 1) |
| season | int | query | no | Season filter (default: all seasons) |

**Response:**

```json
{
  "page": 1,
  "per_page": 10,
  "matches": [
    {
      "match_id": 123456789,
      "date": "2024-01-15T10:30:00Z",
      "map": 5,
      "duration": 600,
      "season": 12,
      "region": 1,
      "kills": 15,
      "deaths": 8,
      "assists": 3,
      "score": 1500,
      "damage_done": 2500,
      "headshots": 5,
      "accuracy": 35,
      "objective_score": 200,
      "kr": 50,
      "victory": 1,
      "rounds_won": 6,
      "team": 1,
      "play_time": 580,
      "mmr": 1850
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| match_id | int64 | Unique match identifier |
| date | string | Match date (RFC3339 format) |
| map | int | Map ID |
| duration | int | Match duration in seconds |
| season | int | Ranked season number |
| region | int | Region ID |
| kills | int | Player's kills in this match |
| deaths | int | Player's deaths in this match |
| assists | int | Player's assists in this match |
| score | int | Player's score in this match |
| damage_done | int | Player's damage dealt in this match |
| headshots | int | Player's headshots in this match |
| accuracy | int | Player's accuracy percentage |
| objective_score | int | Player's objective score |
| kr | int | KR earned from this match |
| victory | int | Match result (1 = win, 0 = loss, -1 = draw) |
| rounds_won | int | Rounds won by player's team |
| team | int | Player's team number |
| play_time | int | Player's active play time in milliseconds |
| mmr | int | Player's MMR at the time of this match |

**Notes:**

- Only ranked matches are returned
- Page size is fixed at 10 records
- Matches are ordered by date descending
- The `mmr` field shows the player's rating after each match, allowing you to calculate MMR changes between matches

---

### Get Player Posts

Retrieve a player's social media posts (paginated).

```http
GET /api/player/:playername/posts
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| playername | string | path | yes | The player's in-game username |
| page | int | query | no | Page number (default: 1) |

**Response:**

```json
{
  "page": 1,
  "per_page": 10,
  "posts": [
    {
      "date": "2024-01-15T10:30:00Z",
      "text": "Just hit level 100!",
      "votes": 42,
      "comment_count": 5
    }
  ]
}
```

---

## Match Endpoints

### Get Match Details

Retrieve detailed information about a specific ranked match.

```http
GET /api/match/:id
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| id | int64 | path | yes | The match ID |

**Response:**

```json
{
  "match_id": 123456789,
  "date": "2024-01-15T10:30:00Z",
  "map": 5,
  "duration": 600,
  "season": 12,
  "region": 1,
  "participants": [
    {
      "player_name": "Player1",
      "kills": 15,
      "deaths": 8,
      "assists": 3,
      "score": 1500,
      "damage_done": 2500,
      "headshots": 5,
      "accuracy": 35,
      "objective_score": 200,
      "victory": 1,
      "rounds_won": 6,
      "team": 1,
      "play_time": 580
    }
  ]
}
```

**Notes:**

- Only ranked matches are returned
- Participants are ordered by team, then by score descending

---

## Clan Endpoints

### Get Clan Profile

Retrieve a clan's public information.

```http
GET /api/clan/:clanname
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| clanname | string | path | yes | The clan's name |

**Response:**

```json
{
  "name": "Elite Squad",
  "owner_name": "ClanLeader",
  "score": 5000000,
  "rank": 15,
  "member_count": 25,
  "created_at": "2023-06-01T00:00:00Z",
  "discord": "abc123xyz"
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| name | string | Clan name |
| owner_name | string | Name of the clan owner |
| score | int64 | Clan's total score |
| rank | int | Clan's leaderboard rank |
| member_count | int | Number of members in the clan |
| created_at | string | Clan creation date |
| discord | string | Discord invite code (empty string if not set) |

---

### Get Clan Members

Retrieve a clan's member list (paginated).

```http
GET /api/clan/:clanname/members
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| clanname | string | path | yes | The clan's name |
| page | int | query | no | Page number (default: 1) |

**Response:**

```json
{
  "page": 1,
  "per_page": 10,
  "members": [
    {
      "player_name": "ClanLeader",
      "role": 3,
      "verified": true
    },
    {
      "player_name": "Member1",
      "role": 1,
      "verified": false
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| player_name | string | Member's username |
| role | int | Member's role in the clan |
| verified | bool | Whether the player is verified |
| score | int | *undocumented* - the member's total score |

**Notes:**

- Page size is fixed at 10 records
- Members are sorted by role (descending), then by score (descending)

---

## Leaderboard Endpoints

### Get Ranked Leaderboard

Retrieve the ranked leaderboard for a specific region.

```http
GET /api/leaderboard/:region
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| region | int | path | yes | The region ID (2 = Asia, 3 = Europe, 4 = North America) |
| page | int | query | no | Page number (default: 1) |
| season | int | query | no | Season number (default: current season) |

**Response:**

```json
{
  "page": 1,
  "per_page": 10,
  "season": 5,
  "region": 0,
  "entries": [
    {
      "position": 1,
      "player_name": "TopPlayer",
      "mmr": 2500,
      "wins": 150,
      "losses": 50,
      "kills": 3000,
      "deaths": 1500,
      "assists": 800,
      "score": 50000,
      "damage_done": 450000
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| page | int | Current page number |
| per_page | int | Number of entries per page (10) |
| season | int | Current ranked season |
| region | int | Region ID |
| entries | object\[\] | Array of leaderboard entries |
| entries\[\].position | int | Leaderboard position |
| entries\[\].player_name | string | Player's username |
| entries\[\].mmr | int | Matchmaking rating |
| entries\[\].wins | int | Total ranked wins |
| entries\[\].losses | int | Total ranked losses |
| entries\[\].kills | int | Total kills in ranked matches |
| entries\[\].deaths | int | Total deaths in ranked matches |
| entries\[\].assists | int | Total assists in ranked matches |
| entries\[\].score | int | Total score in ranked matches |
| entries\[\].damage_done | int | Total damage dealt in ranked matches |

**Notes:**

- Only players with 6+ completed placement matches appear on the leaderboard
- Page size is fixed at 10 records
- Entries are sorted by MMR descending
- Use the `season` parameter to query historical seasons (omit or set to 0 for current season)

---

## Map Endpoints

### Get Map by Name

Retrieve map information by its name.

```http
GET /api/map/:mapname
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| mapname | string | path | yes | The map's name (URL encoded) |

**Response:**

```json
{
  "map_id": 12345,
  "name": "MyAwesomeMap",
  "description": "A fun parkour map",
  "creator_name": "MapMaker",
  "votes": 500,
  "gameplays": 10000,
  "playtime": 3600000,
  "category": 5,
  "created_at": "2023-01-15T10:30:00Z",
  "updated_at": "2023-06-20T14:00:00Z",
  "leaderboard_type": "time",
  "leaderboard_order": 0
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| map_id | int | Unique map identifier |
| name | string | Map name |
| description | string | Map description |
| creator_name | string | Username of the map creator |
| votes | int | Total upvotes |
| gameplays | int | Number of times the map has been played |
| playtime | int64 | Total playtime in milliseconds |
| category | int | Map category ID |
| created_at | string | When the map was created |
| updated_at | string | When the map was last updated |
| leaderboard_type | string | Type of leaderboard (e.g., "time", "score", empty if none) |
| leaderboard_order | int | Sort order for leaderboard (0 = ascending/lower is better, 1 = descending/higher is better) |
| featured | bool | *undocumented* - whether the map is currently featured |

**Notes:**

- Returns 404 if map not found or is restricted/deleted
- Map name is case-sensitive (*observed*: it is not, `burg` finds `Burg`)
- *observed*: `created_at` and `updated_at` come as `YYYY-MM-DD HH:MM:SS`, not RFC3339

---

### Get Featured Maps

List every map that is currently featured, newest first. Use [Get Map by Name](#get-map-by-name) for a map's details. To be told when a map is featured or unfeatured, use [Events](#events).

```http
GET /api/maps/featured
```

**Response:**

```json
{
  "maps": [
    { "map_id": 12345, "name": "MyAwesomeMap", "creator_id": 11443974, "creator_name": "MapMaker" }
  ],
  "count": 1
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| maps\[\].map_id | int | Unique map identifier |
| maps\[\].name | string | Map name |
| maps\[\].creator_id | int | Player id of the map creator |
| maps\[\].creator_name | string | Username of the map creator |
| count | int | Number of maps returned |

---

### Get Map Leaderboard

Retrieve the leaderboard for a specific map (paginated).

```http
GET /api/map/:mapname/leaderboard
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| mapname | string | path | yes | The map's name (URL encoded) |
| page | int | query | no | Page number (default: 1) |
| type | string | query | no | Built-in leaderboard to rank on: `score` or `time`. Defaults to the map's configured leaderboard |
| order | int | query | no | 0 = ascending, 1 = descending. Defaults to the map's order for its configured leaderboard; otherwise ascending for `time`, descending for `score` |

**Response:**

```json
{
  "page": 1,
  "per_page": 25,
  "map_name": "MyAwesomeMap",
  "leaderboard_type": "time",
  "leaderboard_order": 0,
  "entries": [
    {
      "position": 1,
      "player_name": "SpeedRunner",
      "value": 12345,
      "date": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| page | int | Current page number |
| per_page | int | Number of entries per page (25) |
| map_name | string | The map name queried |
| leaderboard_type | string | Type of leaderboard (e.g., "time", "score") |
| leaderboard_order | int | Sort order (0 = ascending, 1 = descending) |
| entries | object\[\] | Array of leaderboard entries |
| entries\[\].position | int | Leaderboard position |
| entries\[\].player_name | string | Player's username |
| entries\[\].value | int | Score or time value |
| entries\[\].date | string | When the entry was recorded |

**Notes:**

- Returns empty entries array if the map has no leaderboard configured
- Maps can show both a score and a time leaderboard in-game; use `type` (and `order`) to fetch either. Invalid values return 400
- Page size is fixed at 25 records
- Entries are sorted by value according to leaderboard_order

---

### Get Map Leaderboard Player

Look up a specific player's position on a map leaderboard.

```http
GET /api/map/:mapname/leaderboard/player/:playername
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| mapname | string | path | yes | The map's name (URL encoded) |
| playername | string | path | yes | The player's username (URL encoded) |
| type | string | query | no | Built-in leaderboard to rank on: `score` or `time`. Defaults to the map's configured leaderboard |
| order | int | query | no | 0 = ascending, 1 = descending. Defaults to the map's order for its configured leaderboard; otherwise ascending for `time`, descending for `score` |

**Response:**

```json
{
  "map_name": "MyAwesomeMap",
  "leaderboard_type": "time",
  "leaderboard_order": 0,
  "player_name": "SpeedRunner",
  "position": 42,
  "value": 15234,
  "date": "2024-01-15T10:30:00Z"
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| map_name | string | The map name queried |
| leaderboard_type | string | Type of leaderboard (e.g., "time", "score") |
| leaderboard_order | int | Sort order (0 = ascending, 1 = descending) |
| player_name | string | Player's username |
| position | int | Player's position on the leaderboard |
| value | int | Player's score or time value |
| date | string | When the entry was recorded |

**Notes:**

- Returns 404 if the map has no leaderboard (and no `type` is given) or the player has no entry
- Position is calculated dynamically based on current leaderboard standings

---

## Mod Endpoints

### Get Mods

Retrieve a paginated list of mods, sorted by votes (most popular first).

```http
GET /api/mods
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| page | int | query | no | Page number (default: 1) |

**Response:**

```json
{
  "page": 1,
  "per_page": 10,
  "mods": [
    {
      "mod_id": 12345,
      "name": "AwesomeMod",
      "description": "A cool mod that changes textures",
      "creator_name": "ModCreator",
      "votes": 5000,
      "featured": true,
      "version": 15,
      "created_at": "2023-01-15T10:30:00Z",
      "updated_at": "2024-06-20T14:00:00Z"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| page | int | Current page number |
| per_page | int | Number of mods per page (10) |
| mods | object\[\] | Array of mod objects |
| mods\[\].mod_id | int | Unique mod identifier |
| mods\[\].name | string | Mod name |
| mods\[\].description | string | Mod description |
| mods\[\].creator_name | string | Username of the mod creator |
| mods\[\].votes | int | Number of upvotes |
| mods\[\].featured | bool | Whether the mod is featured |
| mods\[\].version | int | Mod version number |
| mods\[\].created_at | string | When the mod was first published (*observed*: `YYYY-MM-DD HH:MM:SS`, not RFC3339) |
| mods\[\].updated_at | string | When the mod was last updated (same format) |

**Notes:**

- Mods are sorted by votes (most popular first)
- Only active mods are returned (deleted mods are excluded)
- Mods from banned users are excluded

---

### Get Mod by Name

Retrieve detailed information about a specific mod.

```http
GET /api/mods/:modname
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| modname | string | path | yes | The mod's name (URL encoded) |

**Response:**

```json
{
  "mod_id": 12345,
  "name": "AwesomeMod",
  "description": "A cool mod that changes textures",
  "creator_name": "ModCreator",
  "votes": 5000,
  "featured": true,
  "version": 15,
  "created_at": "2023-01-15T10:30:00Z",
  "updated_at": "2024-06-20T14:00:00Z"
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| mod_id | int | Unique mod identifier |
| name | string | Mod name |
| description | string | Mod description |
| creator_name | string | Username of the mod creator |
| votes | int | Number of upvotes |
| featured | bool | Whether the mod is featured |
| version | int | Mod version number |
| created_at | string | When the mod was first published |
| updated_at | string | When the mod was last updated |

---

## Market Endpoints

### Get Market Listings by Skin Index

Retrieve market information and active listings for a specific skin.

```http
GET /api/market/skin/:skinindex
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| skinindex | int | path | yes | The skin index (item type ID) |
| page | int | query | no | Page number for listings (default: 1) |
| days | int | query | no | Number of days for price history (default: 30, max: 120) |

**Response:**

```json
{
  "skin_index": 123,
  "total_listings": 45,
  "lowest_price": 500,
  "average_price": 750.5,
  "total_circulating": 3500,
  "listings": [
    {
      "price": 500,
      "seller_name": "Player1",
      "listed_at": "2025-01-15T10:30:00Z"
    }
  ],
  "owners": [
    {
      "player_name": "Collector1",
      "count": 50
    },
    {
      "player_name": "Collector2",
      "count": 25
    }
  ],
  "price_history": [
    {
      "date": "2025-12-01",
      "average_price": 32500.5,
      "sales": 12
    },
    {
      "date": "2025-12-02",
      "average_price": 33000.0,
      "sales": 8
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| skin_index | int | The skin index queried |
| total_listings | int | Total number of active listings |
| lowest_price | int | Lowest listed price (0 if no listings) |
| average_price | float | Average sale price from last 7 days |
| total_circulating | int | Total quantity of this skin in circulation |
| listings | object\[\] | Paginated list of active listings (sorted by price ascending) |
| listings\[\].price | int | Listing price in KR |
| listings\[\].seller_name | string | Seller's username |
| listings\[\].listed_at | string | When the listing was created |
| owners | object\[\] | First 100 owners sorted by quantity owned (descending) |
| owners\[\].player_name | string | Owner's username |
| owners\[\].count | int | Number of this skin the player owns |
| price_history | object\[\] | Daily average sale prices for the specified time period |
| price_history\[\].date | string | Date (YYYY-MM-DD format) |
| price_history\[\].average_price | float | Average sale price on that day |
| price_history\[\].sales | int | Number of sales on that day |

**Notes:**

- Listings are sorted by price (lowest first)
- Page size is fixed at 10 records for listings
- `average_price` is calculated from sales in the last 7 days
- Owners list shows up to 100 players, sorted by quantity owned (highest first)
- Banned users are excluded from the owners list
- `price_history` contains daily averages for days with sales within the specified `days` parameter (default 30, max 120 days / 4 months)

---

## Skin Definitions

### Get Skin Definitions

List all skin definitions with optional filtering.

```http
GET /api/skins
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| page | int | query | no | Page number (default: 1) |
| per_page | int | query | no | Items per page (default: 100, max: 10000) |
| season | int | query | no | Season filter (returns only skins for the specified season) |

**Response:**

```json
{
  "page": 1,
  "per_page": 100,
  "total": 8432,
  "skins": [
    {
      "index": 0,
      "name": "Arctic Hunt",
      "type": 0,
      "rarity": 1,
      "weapon": 1
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| page | int | Current page number |
| per_page | int | Items per page |
| total | int | Total number of matching skins |
| skins | array | Array of skin objects |
| skins\[\].index | int | Skin index (ID) |
| skins\[\].name | string | Skin name |
| skins\[\].type | int | Skin type |
| skins\[\].rarity | int | Skin rarity |
| skins\[\].weapon | int | Weapon index (omitted if null) |
| skins\[\].seas | int | *undocumented* - the skin's season; this is the field name the `season` filter refers to, there is no `season` field in the reply |
| skins\[\].thumbnail | string | *undocumented* - preview image URL |
| skins\[\].tradable | bool | *undocumented* |
| skins\[\].id | int | *undocumented* - equals `index` on `GET /api/skins/:skinid`, absent in the list |

**Notes:**

- Each skin object may contain additional properties from its configuration, merged into the root level (*observed*: `creator`, `glow`, `frames`, `frameT`, `mid`, `midT`, `pulsT`, ...)
- Use the `season` parameter to retrieve skins for a specific ranked season
- Skins without a season field are treated as season 1

**Example:**

Get skins from season 12:

```http
GET /api/skins?season=12&per_page=50
```

---

### Get Skin Definition

Get a single skin definition by its index.

```http
GET /api/skins/:skinid
```

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| skinid | int | path | yes | The skin index (0-based) |

**Response:**

```json
{
  "index": 0,
  "name": "Arctic Hunt",
  "type": 0,
  "rarity": 1,
  "weapon": 1
}
```

**Error Responses:**

- 400 if skinid is not a valid integer
- 404 if skin does not exist

---

## KPD Endpoints

### Get Latest KPD Calls

List the 50 most recent KPD (player hacker-report) calls, newest first, across all statuses so officer verdicts are visible. Requires the `kpd` scope.

```http
GET /api/kpd/latest-calls
```

**Parameters:**

None.

**Response:**

```json
[
  {
    "id": 3314982,
    "date": "2026-06-30T09:41:12Z",
    "caller_id": 2,
    "caller_name": "player",
    "caller_score": 184320,
    "caller_job_rating": 12,
    "caller_job_rating_positive": 9,
    "called_id": 81234,
    "called_name": "suspect",
    "called_score": 4521,
    "kdf_type": 0,
    "kdf_type_label": "public",
    "status": 3,
    "status_label": "reviewed",
    "rating": 1,
    "rating_label": "banned",
    "officer_id": 47707163,
    "officer_name": "Officer",
    "status_date": "2026-06-30T09:45:03Z",
    "game_code": "ab12cd",
    "host": "ny.krunker.io",
    "port": "5000",
    "token": "a1b2c3d4e5f6g7h"
  }
]
```

**Response Fields:**

| Field | Type | Description |
| --- | --- | --- |
| id | int | Report id |
| date | string | Call time (RFC 3339, UTC) |
| caller_id | int | Reporter player id |
| caller_name | string | Reporter name |
| caller_score | int | Reporter score |
| caller_job_rating | int | Reporter's total KPD job rating |
| caller_job_rating_positive | int | Reporter's correct (positive) call count |
| called_id | int | Reported player id |
| called_name | string | Reported player name (`guest` if unregistered) |
| called_score | int | Reported player score |
| kdf_type | int | Call context: 0=public, 1=ranked, 2=comp, 3=custom |
| kdf_type_label | string | Readable kdf_type |
| status | int | 1=not responded, 2=responded, 3=reviewed |
| status_label | string | Readable status |
| rating | int | Officer verdict: 0=pending, 1=banned, 2=rejected |
| rating_label | string | Readable rating |
| officer_id | int | Officer who handled the call (0 if none) |
| officer_name | string | Officer name |
| status_date | string | Last status change (RFC 3339, UTC) |
| game_code | string | Game instance code |
| host | string | Game server host |
| port | string | Game server port |
| token | string | Internal call token |

**Notes:**

- Player IP addresses are not exposed.
- A fixed window of the 50 most recent calls; there is no pagination.

---

## Events

Events tell you when something happens on Krunker, such as a map being featured. You can poll for them, or have them pushed to a webhook (below). Both use the same events.

Each event type belongs to one **events scope**. A key only sees the types whose scope it holds; ask for a scope from the partner portal.

| Type | Scope | Sent when |
| --- | --- | --- |
| `map.featured` | `events.maps` | A map was featured |
| `map.unfeatured` | `events.maps` | A map is no longer featured |

Every key with the scope gets the event. Events are kept for 30 days.

### List Events

```http
GET /api/events?after=:id
```

Returns events newer than `after`, oldest first. Store `next` and pass it as `after` on your next call. Start with `after=0`. Keep the same filters between calls; `next` also moves past events your filters skipped, so changing filters later does not bring those back.

**Rate limit:** 6 requests per minute per key, on top of the general limit. The `X-RateLimit-*` headers on this endpoint describe this 6-per-minute limit. Poll every 20 to 60 seconds; if `has_more` is `true`, fetch the next page right away.

**Parameters:**

| Name | Type | Location | Required | Description |
| --- | --- | --- | --- | --- |
| after | int | query | no | Event id cursor (default 0) |
| types | string | query | no | Comma-separated event types to return (default: all your scopes allow) |
| target_type | string | query | no | Only events about this kind of target, e.g. `map` |
| target_id | string | query | no | Comma-separated target ids, up to 100 (needs `target_type`), e.g. `target_type=map&target_id=8497,8500` |
| limit | int | query | no | 1 to 100 (default 100) |

**Response:**

```json
{
  "events": [
    {
      "id": 1042,
      "type": "map.featured",
      "created_at": "2026-10-10T19:30:12Z",
      "target": { "type": "map", "id": 8497 },
      "data": { "map_id": 8497, "map_name": "Bhop_Ravine", "creator": "someone" }
    }
  ],
  "next": 1042,
  "has_more": false
}
```

Events appear a few seconds after they happen. Ids only increase; gaps are normal.

**Event data:**

| Type | `data` fields |
| --- | --- |
| `map.featured`, `map.unfeatured` | `map_id`, `map_name`, `creator` |

---

## Webhooks

Instead of polling, Krunker can POST each event to your HTTPS endpoint. The Krunker team enables webhooks for your key; you then add endpoints, pick their event types and see deliveries under **Developer > Webhooks** in the partner portal.

**Request:** `POST` with a JSON body shaped like one item of `events` above, and these headers:

| Header | Description |
| --- | --- |
| `Krunker-Event-Id` | The event id. The same event can arrive more than once; use this header, not the body's `id`, to ignore repeats (test and signature-check requests have `"id": 0` and an id like `test-...` / `verify-...` here) |
| `Krunker-Event-Type` | The event type, e.g. `map.featured` (`webhook.test` for test sends, `webhook.verify` for the signature check) |
| `Krunker-Delivery-Id` | This delivery |
| `Krunker-Delivery-Attempt` | 1 for the first try, then 2, 3, ... It can also go up without a failed request on your side (e.g. an attempt cut off by a restart on ours), and starts again at 1 when you redeliver from the portal |
| `Krunker-Signature` | `t=<unix seconds>,v1=<signature>` |

**Respond** with any 2xx within 10 seconds. Anything else, a timeout or a redirect counts as a failure and is retried after 30s, 2m, 10m, 30m, 1h, 2h, 4h, 8h and 8h (about a day). If an endpoint keeps failing for that whole time it is turned off and you get a Krunker Mail; fix it and turn it back on in the portal. Events that happen while a webhook is off are not sent to it; catch up with `GET /api/events`, or redeliver single events from the portal. Delivery order is not guaranteed.

**Verify the signature.** Compute HMAC-SHA256 of `<t>.<raw request body>` with your endpoint's signing secret (`whsec_...`, shown once when you create or rotate it), hex-encode it and compare it with `v1` in constant time. Reject requests whose `t` is more than 5 minutes old. Answer `401` when either check fails.

```javascript
import { createHmac, timingSafeEqual } from 'node:crypto';

function verify(rawBody, header, secret) {
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
  return parts.v1?.length === expected.length && timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected));
}
```

**Signature check.** A webhook receives nothing until its endpoint passes a check. Click **Verify** on the webhook page after you install the secret. Krunker then sends 10 `webhook.verify` requests in random order:

- Some are signed with your secret; answer them with a 2xx.
- The others carry a wrong signature; reject them with `401 Unauthorized`. Any other status fails the check.

The first wrong answer, error or timeout fails the check, and the page says which request failed. After you rotate the secret, verify again. If you change the URL, the check runs again by itself. It also runs again when you turn a webhook back on after it was turned off for failing.

```json
{
  "id": 0,
  "type": "webhook.verify",
  "created_at": "2026-10-11T09:12:44Z",
  "target": { "type": "webhook", "id": 12 },
  "data": { "nonce": "4f9c0e6a1b2d3c4e5f60718293a4b5c6" }
}
```

Endpoints must use `https` and resolve to a public address.

In krapi, `verifyWebhook(rawBody, request.headers.get("Krunker-Signature"), secret)` does the whole check above on WebCrypto, and `signWebhook` produces the header for your own tests.

---

## Error Responses

All endpoints return standard error responses:

| Status Code | Description |
| --- | --- |
| 400 | Bad request (missing or invalid parameters) |
| 403 | Forbidden (invalid API key) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

**Error Response Format:**

```json
{
  "error": "Error message description"
}
```
