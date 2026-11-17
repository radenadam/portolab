# 0055. Price times and the filled ticket have measured allowances

- Status: Accepted. [Decision 0056](0056-the-owner-supplies-company-logos-outside-the-repository.md) replaces its JavaScript ceilings for Saham and the ticket.
- Date: 2026-11-17

## Context

The second polish of the screens of [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) removes the links that sent the reader of Saham and Analisis to Beranda for the times of the prices. The price-time standard of `AGENTS.md` still asks for those times, so both screens now state the time of their prices once and list the holdings whose prices have another time. The docked ticket leaves the times to the header of its stock, and its success state shows the side, the tile, the amount paid, and the cash, as the prototype draws it.

One function, `ownQuoteTime` in `app/features/market-data/shared-quote-time.ts`, decides which time a price shows beside it on every screen, and the components of Pasar, Beranda, Aktivitas, Saham, the ticket, and Analisis call it. Its code and its three messages, which hold both languages, now load on the routes of Saham and Analisis as well.

These measurements use `pnpm build` and `pnpm size`, with the compression and the complete dependency walk of [decision 0038](0038-client-javascript-is-budgeted-by-route.md). kB means 1,000 bytes. Main is `a7aec78`.

| Route                  | Main, JavaScript kB | This change, JavaScript kB |
| ---------------------- | ------------------: | -------------------------: |
| Saham                  |              212.46 |                     213.36 |
| Ticket                 |              220.06 |                     221.28 |
| Analisis               |              200.65 |                     201.64 |
| Demonstration Analisis |              201.51 |                     202.51 |

The ticket includes Saham, its parent route, so it carries the 0.90 kB of Saham and 0.32 kB of its own for the success state. Moving the side tag out of the module of Aktivitas kept the rest of Aktivitas off the ticket, which first measured 224.46 kB, and the icons of the order of Pasar stay with Pasar, so shared JavaScript keeps its ceiling.

## Decision

- `features/measures/measures-page` has a JavaScript ceiling of 201.7 kB gzip.
- `features/measures/demonstration-analysis-page` has a JavaScript ceiling of 202.6 kB gzip.
- Every other ceiling, the CSS ceilings of these routes, and the dependency walk keep their rules.

## Alternatives

- **Loaders write the texts of the times.** Saham and Analisis would save most of the growth, but the rule of which time a price shows would live in loaders for two screens and in components for the others, so one rule would have two implementations that can drift apart.
- **The links to Beranda stay.** They meet the standard with fewer bytes, but the references draw no such link, and the reader leaves the screen to learn how old a number on it is.

## Consequences

- The four routes grow by about 1 kB each, which a phone on a slow network loads in a fraction of a second, and the ceilings again guard any further growth.
- `scripts/client-route-limits.ts` holds the new ceilings beside those of decisions 0049, 0053, and 0054.
