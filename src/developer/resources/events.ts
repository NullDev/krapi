import type { KrunkerClient } from "../../client.js";
import { KrunkerArgumentError } from "../../errors.js";
import * as check from "../../validate.js";
import type { EventsPage, EventType } from "../types.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

/** target ids one events call may filter by */
export const MAX_EVENT_TARGETS = 100;
/** the largest page the events endpoint serves */
export const MAX_EVENTS_PER_PAGE = 100;

/** filters of GET /api/events; keep them the same between calls when paging with `after` */
export type EventsQuery = {
    /** event id cursor, the `next` of the previous page; 0 when omitted */
    after?: number;
    /** only these types; everything the key's scopes allow when omitted */
    types?: EventType[];
    /** only events about this kind of target, e.g. "map" */
    target_type?: string;
    /** only these targets, 100 at most, needs target_type */
    target_id?: (number | string)[];
    /** 1 to 100, 100 when omitted */
    limit?: number;
};

/** events the key's scopes allow, kept for 30 days; own limit of 6 requests a minute on top of the key's */
export class EventsApi {
    readonly #client: KrunkerClient;

    constructor(client: KrunkerClient){
        this.#client = client;
    }

    /** GET /api/events, oldest first; keep the same filters between calls, `next` also moves past events the filters skipped */
    list(query: EventsQuery = {}): Promise<EventsPage> {
        if (query.target_id !== undefined && query.target_id.length > 0 && query.target_type === undefined){
            throw new KrunkerArgumentError("target_id needs target_type");
        }
        return this.#client.get("/api/events", {
            route: "events.list",
            query: {
                after: check.optionalInt(query.after, "after", 0),
                types: check.textList(query.types, "types"),
                target_type: query.target_type === undefined ? undefined : check.text(query.target_type, "target_type"),
                target_id: check.idList(query.target_id, "target_id", MAX_EVENT_TARGETS),
                limit: check.optionalInt(query.limit, "limit", 1, MAX_EVENTS_PER_PAGE),
            },
        });
    }
}
