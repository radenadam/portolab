# 0060. A personal watchlist has measured route allowances

- Status: Accepted
- Date: 2026-11-18

## Context

Piece 26 of #127 adds the stars and Pantauan Anda of the approved Peta design. A star expresses a person's interest in a stock. It does not describe the work of one class or contribute to a portfolio measure.

The measurements compare main at `5a209f4` with this change, using `pnpm build` and `pnpm size` with the same dependencies. The baseline comes from the successful [Check run of main](https://github.com/radenadam/portolab/actions/runs/44251189259/job/134621997654) at that commit. The dependency walk and gzip method follow decisions [0038](0038-client-javascript-is-budgeted-by-route.md) and [0042](0042-client-css-is-budgeted-by-route.md). kB means 1,000 bytes. The new star reuses the existing form and icon-button styles. The hidden column label and the sector legend share one style that keeps their text available to assistive technology. The form and table primitives are shared, and the budget counts every emitted chunk that each route requires.

| Dependency set         | Main JavaScript kB | Watchlist JavaScript kB | Main CSS kB | Watchlist CSS kB |
| ---------------------- | -----------------: | ----------------------: | ----------: | ---------------: |
| Shared                 |             141.94 |                  142.06 |        7.79 |             7.79 |
| Beranda                |             220.62 |                  220.81 |       23.68 |            23.74 |
| Pasar                  |             200.31 |                  201.33 |       20.73 |            21.10 |
| Saham                  |             215.45 |                  216.25 |       20.91 |            21.24 |
| Ticket                 |             223.38 |                  224.18 |       23.74 |            24.06 |
| Analisis               |             203.72 |                  203.91 |       18.82 |            18.88 |
| Demonstration analysis |             204.60 |                  204.78 |       19.45 |            19.51 |

## Decision

A watchlist belongs to a person across classes. Each entry stores the person, stock code, and time added. Portolab shows it only to its owner. Removing a star deletes its entry, and deleting the account cascades to its entries. Repeating an addition keeps its first time, so a repeated form submission does not change the record. The privacy notice and the operator's export query include it.

Pasar shows watched stocks from the current LQ45 list above the full list. Both lists share filters, sorting, column widths, and scale domains. An entry can remain stored after a stock leaves that universe, and its star remains available on the stock page.

Beranda has a JavaScript ceiling of 221 kB gzip. Pasar has JavaScript and CSS ceilings of 201.6 and 21.4 kB. Saham has JavaScript and CSS ceilings of 216.5 and 21.5 kB. The ticket has JavaScript and CSS ceilings of 224.4 and 24.3 kB. Analisis and demonstration analysis have JavaScript ceilings of 204.2 and 205.1 kB. Every other ceiling and the dependency walk keep their rules.

The stars are server forms, so they work before JavaScript loads. The added CSS is about 0.4 kB gzip on Pasar and 0.3 kB on Saham and the ticket. Beranda, Analisis, and demonstration analysis gain 0.06 kB of CSS, because their tables share the hidden label style. The address of the stars reuses the page of an address that does not exist, so its module imports the JSX runtime as every other page does. A first version rendered nothing there, and the bundler then split the shared React chunk in two, which added about 0.9 kB of JavaScript to every route. Browser checks cover touch at 360 pixels, keyboard access, both themes, native submission, hydration, separate owners, and aligned tables. The sample command gives both roles a watchlist. These checks and measurements support the narrow allowances. They do not measure latency on every phone.

## Alternatives

- A watchlist per class would repeat a person's preferences and lose them when a class ends.
- A client-only watchlist would lose stars on another device and would fail before scripts load.
- A separate star form primitive would avoid a small change to shared form code, but would duplicate pending-submission behavior.
- Raising every route ceiling would allow unrelated growth. Exact entries keep the allowances on the measured dependency sets.

## Consequences

The watchlist has no class foreign key and is excluded from lecturer views of students and from grading exports. The operator's personal-data export includes it, and the account deletion query removes it through its foreign key. When a person removes the star on a stock page that Pantauan Anda opened, the way back leads to the row of the stock in the full list, because its watched row no longer exists. Route budget tests keep these allowances on the named dependency sets.
