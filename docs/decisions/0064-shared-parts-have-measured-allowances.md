# 0064. Shared parts have measured allowances

- Status: Accepted
- Date: 2026-11-18

## Context

Issues #287 and #289 list the parts that many screens share and that still differ from the references of [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md). The axis of returns of every map marks about six signed values, the IHSG of Pasar shows its change in the tinted chip of a stock, the menu of the profile shows the avatar beside the name, and the theme holds one primary button.

The chip, the avatar, and the format of signed marks are new code on every route that shows them. The frame and the menu of the profile load on every route, and the screens of the lecturer draw the avatar of a student through the same component, so the build puts the avatar in a chunk and a stylesheet of their own. Shared JavaScript grows by about 0.44 kB and shared CSS by about 0.11 kB, and every route grows with them. No dependency is added, and the stylesheets of the screens shrink where they no longer repeat the looks that the theme and the shared modules now hold.

## Decision

The following ceilings replace the ceilings of decisions [0060](0060-learning-practices-have-measured-sheet-allowances.md), [0061](0061-analysis-panels-have-measured-route-allowances.md), and [0063](0063-a-personal-watchlist-has-measured-route-allowances.md) only for these dependency sets. An empty cell keeps the earlier CSS ceiling. Every other ceiling and the complete dependency walk of decisions [0038](0038-client-javascript-is-budgeted-by-route.md) and [0042](0042-client-css-is-budgeted-by-route.md) keep their rules. A set that passes its earlier ceiling by less than 0.05 kB gets the same margin as a set that exceeds it, because the hashes of another build change compressed totals by tens of bytes.

| Dependency set              | JavaScript ceiling, kB gzip | CSS ceiling, kB gzip |
| --------------------------- | --------------------------: | -------------------: |
| Shared code                 |                       143.4 |                      |
| Class home                  |                       236.3 |                 26.0 |
| Market                      |                       221.7 |                 23.4 |
| Activity                    |                       211.8 |                      |
| Demonstration summary       |                       225.2 |                      |
| Demonstration Activity      |                       212.7 |                      |
| Demonstration analysis      |                       230.9 |                      |
| Student analysis            |                       230.1 |                 22.4 |
| Stock                       |                       231.2 |                 23.5 |
| Ticket                      |                       239.0 |                      |
| Class ranking               |                       207.1 |                      |
| Lecturer's student summary  |                       226.0 |                      |
| Lecturer's student analysis |                       231.4 |                      |
| Lecturer's student journal  |                       213.0 |                      |

## Measurements

The comparison builds main at `7859fec` and this change, merged with that main, on the same machine, with `pnpm build` and `pnpm size`. Both use the compression and the complete dependency walk of decisions 0038 and 0042. kB means 1,000 bytes. Both languages count.

| Dependency set              | Main JavaScript | This change JavaScript | Main CSS | This change CSS |
| --------------------------- | --------------: | ---------------------: | -------: | --------------: |
| Shared code                 |          142.78 |                 143.22 |     7.90 |            8.01 |
| Class home                  |          235.42 |                 236.08 |    25.54 |           25.85 |
| Market                      |          220.84 |                 221.52 |    22.89 |           23.19 |
| Activity                    |          211.17 |                 211.65 |    20.18 |           20.30 |
| Demonstration summary       |          224.33 |                 224.98 |    23.26 |           23.55 |
| Demonstration Activity      |          212.03 |                 212.51 |    20.82 |           20.94 |
| Demonstration analysis      |          230.29 |                 230.76 |    22.66 |           22.81 |
| Student analysis            |          229.42 |                 229.89 |    22.03 |           22.17 |
| Stock                       |          230.40 |                 231.00 |    23.03 |           23.25 |
| Ticket                      |          238.17 |                 238.78 |    25.85 |           26.03 |
| Class ranking               |          206.40 |                 206.91 |    20.26 |           20.31 |
| Lecturer's student summary  |          225.13 |                 225.78 |    23.65 |           23.87 |
| Lecturer's student analysis |          230.78 |                 231.24 |    23.05 |           23.13 |
| Lecturer's student journal  |          212.33 |                 212.81 |    21.21 |           21.26 |

Every other stylesheet set passes its ceiling with at least 0.05 kB to spare, and every other JavaScript set passes its ceiling with at least 0.1 kB to spare.

## Alternatives

- Keep the earlier ceilings. The required dependency sets fail them.
- Leave the chip and the avatar on the screens that drew them before. The other screens would keep differing from their references.
- Draw the avatars of the lecturer's screens with their own markup, which keeps the avatar in the chunk of the frame. Their initials would stay apart from the one component, and a copy of its markup had already drawn them off center.
- Raise every route ceiling. The other routes pass their ceilings with room to spare, so the allowances name only the measured routes that need them.

## Consequences

`scripts/client-route-limits.ts` keeps these allowances, and its tests check each of these ceilings.
