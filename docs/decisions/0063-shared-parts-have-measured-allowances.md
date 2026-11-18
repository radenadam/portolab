# 0063. Shared parts have measured allowances

- Status: Accepted
- Date: 2026-11-18

## Context

Issues #287 and #289 list the parts that many screens share and that still differ from the references of [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md). The axis of returns of every map marks about six signed values, the IHSG of Pasar shows its change in the tinted chip of a stock, the menu of the profile shows the avatar beside the name, and the theme holds one primary button and one text that only a screen reader reads.

The chip, the avatar, and the format of signed marks are new code on every route that shows them. The frame and the menu of the profile load on every route, so shared JavaScript grows by about 0.18 kB, and every route grows with it. No dependency is added, and the stylesheets of the screens shrink where they no longer repeat the looks that the theme now holds.

## Decision

The following ceilings replace the ceilings of decisions [0060](0060-learning-practices-have-measured-sheet-allowances.md) and [0061](0061-analysis-panels-have-measured-route-allowances.md) only for these dependency sets. Every other ceiling and the complete dependency walk of decisions [0038](0038-client-javascript-is-budgeted-by-route.md) and [0042](0042-client-css-is-budgeted-by-route.md) keep their rules. Demonstration analysis, student analysis, and the lecturer's student analysis pass their earlier ceilings by less than 0.1 kB, and the hashes of another build change compressed totals by tens of bytes, so they get the same margin as the routes that exceed their ceilings.

| Dependency set              | JavaScript ceiling, kB gzip |
| --------------------------- | --------------------------: |
| Shared code                 |                       143.0 |
| Class home                  |                       235.8 |
| Market                      |                       220.4 |
| Activity                    |                       211.4 |
| Demonstration summary       |                       224.7 |
| Demonstration Activity      |                       212.3 |
| Demonstration analysis      |                       230.5 |
| Student analysis            |                       229.6 |
| Stock                       |                       230.1 |
| Ticket                      |                       237.9 |
| Class ranking               |                       206.7 |
| Lecturer's student summary  |                       225.5 |
| Lecturer's student analysis |                       231.0 |
| Lecturer's student journal  |                       212.6 |

## Measurements

The comparison builds main at `d8bc523` and this change, merged with that main, on the same machine, with `pnpm build` and `pnpm size`. Both use the compression and the complete dependency walk of decisions 0038 and 0042. kB means 1,000 bytes. Both languages count.

| Dependency set              | Main JavaScript | This change JavaScript | Main CSS | This change CSS |
| --------------------------- | --------------: | ---------------------: | -------: | --------------: |
| Shared code                 |          142.65 |                 142.83 |     7.90 |            7.89 |
| Class home                  |          235.22 |                 235.63 |    25.48 |           25.63 |
| Market                      |          219.80 |                 220.23 |    22.52 |           22.66 |
| Activity                    |          211.03 |                 211.25 |    20.18 |           20.18 |
| Demonstration summary       |          224.14 |                 224.53 |    23.20 |           23.33 |
| Demonstration Activity      |          211.90 |                 212.12 |    20.82 |           20.82 |
| Demonstration analysis      |          230.10 |                 230.31 |    22.60 |           22.63 |
| Student analysis            |          229.23 |                 229.44 |    21.97 |           21.99 |
| Stock                       |          229.59 |                 229.93 |    22.70 |           22.71 |
| Ticket                      |          237.36 |                 237.71 |    25.53 |           25.49 |
| Class ranking               |          206.26 |                 206.52 |    20.26 |           20.21 |
| Lecturer's student summary  |          224.94 |                 225.34 |    23.59 |           23.73 |
| Lecturer's student analysis |          230.58 |                 230.80 |    22.99 |           23.03 |
| Lecturer's student journal  |          212.19 |                 212.42 |    21.21 |           21.22 |

Every stylesheet set passes its ceiling, and every other JavaScript set passes its ceiling with more than 0.1 kB to spare.

## Alternatives

- Keep the earlier ceilings. The required dependency sets fail them.
- Leave the chip and the avatar on the screens that drew them before. The other screens would keep differing from their references.
- Raise every route ceiling. The other routes pass their ceilings with room to spare, so the allowances name only the measured routes that need them.

## Consequences

`scripts/client-route-limits.ts` keeps these allowances, and its tests check each of these ceilings.
