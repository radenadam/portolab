# 0069. The review of 19 November 2026 has measured allowances

- Status: Accepted
- Date: 2026-11-19

## Context

[Decision 0068](0068-the-review-of-19-november-2026-changes-parts-of-the-screens.md) changes parts of the screens after the maintainer's review. Most of its looks are rules of the theme that every screen loads: the hover of buttons and rows that open something, the reach of a link that stands alone, the scrolling tables with a sticky head, and the popovers that stay beside their buttons. The checkbox draws its own box, and the stock page, the holdings, Dampak, and Analisis gain the rows and the labels that the review asked for. So shared CSS grows by about 0.52 kB, and every route grows with it.

The same review removes the side panel of Mahasiswa, the table and the administration of Kelas, and the journal column of Aktivitas. So the JavaScript of Kelas, Mahasiswa, and the lists of orders shrinks by 0.6 to 3 kB. The routes that show a stock or the analysis of a portfolio grow by 0.15 to 0.26 kB of JavaScript, because their measures, choices of a view, and header actions hold new markup. No dependency is added.

## Decision

The following ceilings replace the ceilings of [decision 0065](0065-the-welcome-has-measured-shared-and-route-allowances.md) and [decision 0067](0067-shared-parts-have-measured-allowances.md) only for these dependency sets. An empty cell keeps the earlier ceiling. Every other ceiling and the complete dependency walk of decisions [0038](0038-client-javascript-is-budgeted-by-route.md) and [0042](0042-client-css-is-budgeted-by-route.md) keep their rules. Each new ceiling leaves at least 0.1 kB of JavaScript or 0.05 kB of CSS above the measured set, because the hashes of another build change compressed totals by tens of bytes.

| Dependency set              | JavaScript ceiling, kB gzip | CSS ceiling, kB gzip |
| --------------------------- | --------------------------: | -------------------: |
| Class home                  |                             |                 28.5 |
| Market                      |                             |                 24.6 |
| Activity                    |                             |                   21 |
| Demonstration summary       |                             |                 24.8 |
| Demonstration Activity      |                             |                 21.6 |
| Demonstration analysis      |                       231.5 |                 24.1 |
| Student analysis            |                       230.7 |                 23.5 |
| Stock                       |                       232.2 |                 25.1 |
| Ticket                      |                         240 |                 28.1 |
| Class ranking               |                             |                 20.9 |
| Lecturer's student summary  |                             |                 25.2 |
| Lecturer's student analysis |                       232.2 |                 24.5 |
| Lecturer's student journal  |                             |                   22 |

## Measurements

The comparison builds main at `3cc92cf6` and this change on the same machine, with `pnpm build` and `pnpm size`. Both use the compression and the complete dependency walk of decisions 0038 and 0042. kB means 1,000 bytes. Both languages count.

| Dependency set              | Main JavaScript | This change JavaScript | Main CSS | This change CSS |
| --------------------------- | --------------: | ---------------------: | -------: | --------------: |
| Shared code                 |          143.57 |                 143.41 |     8.26 |            8.78 |
| Class home                  |          241.55 |                 239.48 |    27.74 |           28.42 |
| Market                      |          221.98 |                 221.93 |    23.44 |           24.50 |
| Activity                    |          212.11 |                 211.37 |    20.55 |           20.88 |
| Demonstration summary       |          226.13 |                 226.00 |    23.85 |           24.72 |
| Demonstration Activity      |          212.98 |                 212.25 |    21.19 |           21.53 |
| Demonstration analysis      |          231.22 |                 231.38 |    23.06 |           24.02 |
| Student analysis            |          230.35 |                 230.50 |    22.42 |           23.38 |
| Stock                       |          231.90 |                 232.08 |    23.75 |           24.96 |
| Ticket                      |          239.68 |                 239.84 |    26.53 |           28.01 |
| Class ranking               |          207.41 |                 204.42 |    20.57 |           20.82 |
| Lecturer's student summary  |          227.03 |                 226.99 |    24.20 |           25.14 |
| Lecturer's student analysis |          231.80 |                 232.05 |    23.41 |           24.44 |
| Lecturer's student journal  |          213.36 |                 212.75 |    21.54 |           21.94 |

Every other stylesheet set passes its ceiling with at least 0.05 kB to spare, and every other JavaScript set passes its ceiling with at least 0.1 kB to spare.

## Alternatives

- **Keep the earlier ceilings.** The dependency sets of the reviewed screens fail them.
- **Move the looks of the review into the modules of each screen.** Each screen would load only its own share, but the hover of a row, the sticky head of a table, and the drawing of a checkbox would drift apart between screens, which the theme exists to prevent.

## Consequences

- The ceilings of the screens that the review changed grow by their measured cost, and the screens that lost the panel, the table, and the journal keep their ceilings with more room.
