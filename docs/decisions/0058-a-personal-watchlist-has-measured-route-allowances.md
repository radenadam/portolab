# 0058. A personal watchlist has measured route allowances

- Status: Accepted
- Date: 2026-11-17

## Context

Piece 26 of #127 adds the stars and Pantauan Anda of the approved Peta design. A star expresses a person's interest in a stock. It does not describe the work of one class or contribute to a portfolio measure.

The measurements compare main at `a63a054` with this change, using `pnpm build` and `pnpm size` with the same dependencies. The baseline comes from the successful [Check run of theme choice](https://github.com/radenadam/portolab/actions/runs/44115139076/job/134151186144) at `12d7589`, whose file tree matches that main commit. The dependency walk and gzip method follow decisions [0038](0038-client-javascript-is-budgeted-by-route.md) and [0042](0042-client-css-is-budgeted-by-route.md). kB means 1,000 bytes. The new star reuses the existing form and icon-button styles. The hidden column label and sector legend share one style that keeps their text available to assistive technology. The form and table primitives are shared, and the budget counts every emitted chunk that each route requires.

| Dependency set         | Main JavaScript kB | Watchlist JavaScript kB | Main CSS kB | Watchlist CSS kB |
| ---------------------- | -----------------: | ----------------------: | ----------: | ---------------: |
| Shared                 |             141.86 |                  142.75 |        7.76 |             7.76 |
| Pasar                  |             200.04 |                  202.00 |       20.63 |            21.00 |
| Saham                  |             215.17 |                  216.98 |       20.81 |            21.14 |
| Ticket                 |             223.09 |                  224.94 |       23.64 |            23.96 |
| Analisis               |             203.63 |                  204.84 |       18.79 |            18.85 |
| Demonstration analysis |             204.50 |                  205.72 |       19.43 |            19.49 |

## Decision

A watchlist belongs to a person across classes. Each entry stores the person, stock code, and time added. Portolab shows it only to its owner. Removing a star deletes its entry, and deleting the account cascades to its entries. Repeating an addition keeps its first time, so a repeated form submission does not change the record. The privacy notice and the operator's export query include it.

Pasar shows watched stocks from the current LQ45 list above the full list. Both lists share filters, sorting, column widths, and scale domains. An entry can remain stored after a stock leaves that universe, and its star remains available on the stock page.

Shared JavaScript has a ceiling of 143 kB gzip. Pasar has JavaScript and CSS ceilings of 202.3 and 21.2 kB. Saham has JavaScript and CSS ceilings of 217.3 and 21.3 kB. The ticket, Analisis, and demonstration analysis have JavaScript ceilings of 225.3, 205.1, and 206 kB respectively. Every other ceiling and the dependency walk keep their rules.

The stars are server forms, so they work before JavaScript loads. The added CSS is about 0.4 kB gzip on Pasar, 0.3 kB on Saham, and 0.06 kB on Analisis and demonstration analysis, whose tables share the hidden label style, so their CSS stays below its default ceiling. Browser checks cover touch at 360 pixels, keyboard access, both themes, native submission, hydration, separate owners, and aligned tables. The sample command gives both roles a watchlist. These checks and measurements support the narrow allowances. They do not measure latency on every phone.

## Alternatives

- A watchlist per class would repeat a person's preferences and lose them when a class ends.
- A client-only watchlist would lose stars on another device and would fail before scripts load.
- A separate star form primitive would avoid a small change to shared form code, but would duplicate pending-submission behavior.
- Raising every route ceiling would allow unrelated growth. Exact entries keep the allowances on the measured dependency sets.

## Consequences

The watchlist has no class foreign key and is excluded from lecturer views of students and from grading exports. The operator's personal-data export includes it, and the account deletion query removes it through its foreign key. When a person removes the star on a stock page that Pantauan Anda opened, the way back leads to the row of the stock in the full list, because its watched row no longer exists. Route budget tests keep these allowances on the named dependency sets.
