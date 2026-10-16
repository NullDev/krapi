---
title: Overview
description: What krapi covers and how the three Krunker APIs relate
---

krapi is a typed client for the Krunker.io APIs with zero dependencies, for Node 20+ and Bun. These pages document the APIs themselves; the [library reference](reference/index.md) is generated from the source, and so is the [OpenAPI document](https://nulldev.github.io/krapi/openapi/) (raw: [openapi.json](https://nulldev.github.io/krapi/openapi.json)) that lists every endpoint of the three tiers.

| Tier | What | Auth | On the client |
| --- | --- | --- | --- |
| [Developer API](developer-api.md) | the documented developer API (`gapi.svc.krunker.io/api/*`), corrected against the live service | `X-Developer-API-Key` | the root: `krunker.player`, `krunker.market`, ... |
| [Game API](game-api.md) | what the game itself reads without any auth: market, Turf Wars, clans, social, shop, matchmaker | none | `krunker.game.*` |
| [Token API](token-api.md) | what the game reads with the player's own FRVR token: wallet, inventory, trades, ranked | `Authorization: Bearer <jwt>` | `krunker.as(token).*` |

```ts
import { Krunker } from "krapi";

const krunker = new Krunker({ apiKey: process.env.KRUNKER_API_KEY, userAgent: "my-bot/1.0" });

await krunker.player.profile("NulPing");              // developer api
await krunker.game.market.stats({ sort: "rarity" });   // game api
await krunker.as(playerToken).player.wallet();         // token api
```

Reads only. Every write of the game API (buying, listing, trading, posting) is left out on purpose. The library caches nothing, put your own cache in front of it.

```sh
bun add krapi
# or
npm install krapi
```

## How these documents were made

The developer API page is the document Krunker (FRVR) provides to key holders, with every difference found by calling the endpoints marked *observed* or *undocumented*. The game and token pages have no original: they were written from the game's client code and from live replies, one unauthenticated or one token bound `GET` per endpoint, in October 2026. None of that is documented or supported by Krunker and all of it can change without notice.
