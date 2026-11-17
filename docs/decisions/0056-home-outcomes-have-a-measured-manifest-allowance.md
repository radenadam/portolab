# 0056. Home outcomes have a measured manifest allowance

- Status: Accepted
- Date: 2026-11-17

## Context

Piece 27 of #127 adds the summary of fills, expiries, and rejections above Beranda. It reuses the order outcome, status, and rejection views of Aktivitas. The outcome and status share a module because both callers use them together. Their styles stay separate from the list and journal styles of Aktivitas.

The new imports also change the route manifest, which every page carries under [decision 0038](0038-client-javascript-is-budgeted-by-route.md). The first measured build exceeded the shared ceiling and four route ceilings by 43, 3, 34, 41, and 65 bytes. Beranda itself fits its existing JavaScript and CSS ceilings.

These production builds use `pnpm build` and `pnpm size`, with the complete dependency walk and gzip method of decision 0038 and [decision 0042](0042-client-css-is-budgeted-by-route.md). The baseline is main at `21dce2a`. Its reported values below are rounded to two decimal places. The changed build keeps exact bytes as kB, where one kB is 1,000 bytes. Both languages count.

| Set                    | Main JavaScript, kB gzip | With home outcomes, kB gzip |
| ---------------------- | -----------------------: | --------------------------: |
| Shared                 |                   140.16 |                     140.239 |
| Beranda                |                   208.97 |                     218.369 |
| Demonstration analysis |                   202.52 |                     202.599 |
| Analisis               |                   201.65 |                     201.730 |
| Saham                  |                   213.36 |                     213.437 |
| Ticket                 |                   221.28 |                     221.361 |

Beranda's CSS grows from 22.58 kB to 23.217 kB. The shared route manifest is 5,096 bytes gzip. The outcome and status views add no import to the root route. Their new dependency graph changes the manifest and the chunks that Vite shares with existing callers.

The two measured versions differ by four bytes in the shared manifest after its asset hashes change. Demonstration analysis is now one byte below its earlier ceiling, while the earlier build exceeded it by three bytes. Its allowance covers both measured sets.

## Decision

- Shared JavaScript has a ceiling of 140.3 kB gzip.
- `features/measures/demonstration-analysis-page` has a JavaScript ceiling of 202.7 kB gzip.
- `features/measures/measures-page` has a JavaScript ceiling of 201.8 kB gzip.
- `features/market-data/stock-page` has a JavaScript ceiling of 213.5 kB gzip.
- `features/trading/ticket-page` has a JavaScript ceiling of 221.4 kB gzip.
- Every other JavaScript ceiling, every CSS ceiling, and the dependency walk keep their rules.

Each changed ceiling adds 100 bytes, which is less than 0.1% of its earlier ceiling. The allowance adds no runtime code. The phone browser checks cover the new native dismissal form before hydration, persistence on another device, both languages, both themes, and the largest order. The sample class supplies every outcome. These checks and the measured byte increases support this narrow allowance without a loading-time promise for a phone.

## Alternatives

- **Keep the earlier ceilings.** The complete dependency sets fail for the small excesses above even though Beranda fits its route budgets.
- **Combine the outcome and status modules.** The final implementation does this, but its measured shared set still exceeds the ceiling. Moving the card behind a deferred import would still count under decision 0038.
- **Raise every route ceiling.** Only the five named sets need an allowance.
- **Change the data contract to preformat home outcomes on the server.** This replaces reuse of the existing outcome views to save code in a route that already fits its ceiling.

## Consequences

`scripts/client-route-limits.ts` holds the allowances. The existing budget tests check each new JavaScript ceiling, its unchanged CSS ceiling, and the default limits of other routes through `clientSizeChecks`. The summary keeps the outcome text, quote times, and rejection help of Aktivitas.
