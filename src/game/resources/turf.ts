import type { KrunkerClient } from "../../client.js";
import * as check from "../../validate.js";
import { unwrap } from "../envelope.js";
import type {
    Envelope,
    TurfClan,
    TurfClanEarning,
    TurfContribution,
    TurfPayouts,
    TurfPlayer,
    TurfPlayerEarning,
    TurfPlayerRow,
    TurfStatus,
    TurfTopClan,
    TurfTopGrossingClan,
    TurfTopPlayer,
} from "../types.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/** turf days count whole utc days from here (season 10 epoch, from the game code) */
export const TURF_EPOCH_UTC = Date.UTC(2026, 2, 17);

/** 0 Burg, 2 Sandstorm, 3 Subzero */
export const TURF_MAPS = { BURG: 0, SANDSTORM: 2, SUBZERO: 3 } as const;

/** the turf day of a date: whole utc days since TURF_EPOCH_UTC */
export const turfDay = (date = new Date()): number => Math.floor((date.getTime() - TURF_EPOCH_UTC) / 86400000);

/** turf day and map filter; today and every map when omitted */
export type DayMapQuery = { day?: number; map_id?: number };

/** GET /territorial-wars/*: Turf Wars status, clans, players and leaderboards */
export class PublicTurfApi {
    readonly #gapi: KrunkerClient;

    constructor(gapi: KrunkerClient){
        this.#gapi = gapi;
    }

    /** GET /territorial-wars/status, every turf map with its owner and top 5 */
    status(): Promise<TurfStatus[]> {
        return unwrap(this.#gapi.get<Envelope<TurfStatus[]>>("/territorial-wars/status", { route: "game.turf.status" }));
    }

    /** GET /territorial-wars/clan/:id */
    clan(clanId: number): Promise<TurfClan> {
        return unwrap(this.#gapi.get<Envelope<TurfClan>>(`/territorial-wars/clan/${check.int(clanId, "clanId", 1)}`, { route: "game.turf.clan" }));
    }

    /** GET /territorial-wars/clan/:id/players, today without a day */
    clanPlayers(clanId: number, query: DayMapQuery = {}): Promise<TurfPlayerRow[]> {
        return unwrap(this.#gapi.get<Envelope<TurfPlayerRow[]>>(`/territorial-wars/clan/${check.int(clanId, "clanId", 1)}/players`, {
            route: "game.turf.clanPlayers",
            query: { day: check.optionalInt(query.day, "day", 0), map_id: check.optionalInt(query.map_id, "map_id", 0) },
        }));
    }

    /** GET /territorial-wars/clan/:id/earnings */
    clanEarnings(clanId: number): Promise<TurfClanEarning[]> {
        return unwrap(this.#gapi.get<Envelope<TurfClanEarning[]>>(`/territorial-wars/clan/${check.int(clanId, "clanId", 1)}/earnings`, { route: "game.turf.clanEarnings" }));
    }

    /** GET /territorial-wars/clan/:id/payouts, season totals without a day */
    clanPayouts(clanId: number, day?: number): Promise<TurfPayouts> {
        return unwrap(this.#gapi.get<Envelope<TurfPayouts>>(`/territorial-wars/clan/${check.int(clanId, "clanId", 1)}/payouts`, {
            route: "game.turf.clanPayouts",
            query: { day: check.optionalInt(day, "day", 0) },
        }));
    }

    /** GET /territorial-wars/leaderboards/top-performing-clans, 100 rows, clan_name is an exact match filter */
    topClans(query: DayMapQuery & { clan_name?: string } = {}): Promise<TurfTopClan[]> {
        return unwrap(this.#gapi.get<Envelope<TurfTopClan[]>>("/territorial-wars/leaderboards/top-performing-clans", {
            route: "game.turf.topClans",
            query: { day: check.optionalInt(query.day, "day", 0), map_id: check.optionalInt(query.map_id, "map_id", 0), clan_name: query.clan_name },
        }));
    }

    /** GET /territorial-wars/leaderboards/top-grossing-clans */
    topGrossing(clanName?: string): Promise<TurfTopGrossingClan[]> {
        return unwrap(this.#gapi.get<Envelope<TurfTopGrossingClan[]>>("/territorial-wars/leaderboards/top-grossing-clans", {
            route: "game.turf.topGrossing",
            query: { clan_name: clanName },
        }));
    }

    /** GET /territorial-wars/leaderboards/top-performing-players, slow (seconds) */
    topPlayers(query: { map_id?: number; player_name?: string } = {}): Promise<TurfTopPlayer[]> {
        return unwrap(this.#gapi.get<Envelope<TurfTopPlayer[]>>("/territorial-wars/leaderboards/top-performing-players", {
            route: "game.turf.topPlayers",
            query: { map_id: check.optionalInt(query.map_id, "map_id", 0), player_name: query.player_name },
        }));
    }

    /** GET /territorial-wars/player/:id, also resolves a stored id to the current name */
    player(playerId: number): Promise<TurfPlayer> {
        return unwrap(this.#gapi.get<Envelope<TurfPlayer>>(`/territorial-wars/player/${check.int(playerId, "playerId", 1)}`, { route: "game.turf.player" }));
    }

    /** GET /territorial-wars/player/:id/contributions, every day and map of the season */
    playerContributions(playerId: number, day?: number): Promise<TurfContribution[]> {
        return unwrap(this.#gapi.get<Envelope<TurfContribution[]>>(`/territorial-wars/player/${check.int(playerId, "playerId", 1)}/contributions`, {
            route: "game.turf.playerContributions",
            query: { day: check.optionalInt(day, "day", 0) },
        }));
    }

    /** GET /territorial-wars/player/:id/earnings */
    playerEarnings(playerId: number): Promise<TurfPlayerEarning[]> {
        return unwrap(this.#gapi.get<Envelope<TurfPlayerEarning[]>>(`/territorial-wars/player/${check.int(playerId, "playerId", 1)}/earnings`, { route: "game.turf.playerEarnings" }));
    }
}
