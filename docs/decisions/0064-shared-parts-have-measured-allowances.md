# 0064. Shared parts have measured allowances

- Status: Accepted
- Date: 2026-11-18

## Context

Issues #287 and #289 list the parts that many screens share and that still differ from the references of [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md). The axis of returns of every map marks about six signed values, the IHSG of Pasar shows its change in the tinted chip of a stock, the menu of the profile shows the avatar beside the name, and the theme holds one primary button.

The chip, the avatar, and the format of signed marks are new code on every route that shows them. The frame and the menu of the profile load on every route, so shared JavaScript grows by about 0.19 kB, and every route grows with it. No dependency is added, and the stylesheets of the screens shrink where they no longer repeat the looks that the theme and the shared modules now hold.

## Decision

The following ceilings replace the ceilings of decisions [0061](0061-analysis-panels-have-measured-route-allowances.md) and [0063](0063-a-personal-watchlist-has-measured-route-allowances.md) only for these dependency sets. Every other ceiling and the complete dependency walk of decisions [0038](0038-client-javascript-is-budgeted-by-route.md) and [0042](0042-client-css-is-budgeted-by-route.md) keep their rules. Shared code, Activity, demonstration Activity, and the lecturer's student journal pass their earlier ceilings by less than 0.05 kB, and the hashes of another build change compressed totals by tens of bytes, so they get the same margin as the sets that exceed their ceilings.

| Dependency set              | JavaScript ceiling, kB gzip |
| --------------------------- | --------------------------: |
| Shared code                 |                       143.2 |
| Class home                  |                       236.0 |
| Market                      |                       221.5 |
| Activity                    |                       211.6 |
| Demonstration summary       |                       224.9 |
| Demonstration Activity      |                       212.5 |
| Demonstration analysis      |                       230.7 |
| Student analysis            |                       229.8 |
| Stock                       |                       230.9 |
| Ticket                      |                       238.7 |
| Class ranking               |                       206.8 |
| Lecturer's student summary  |                       225.7 |
| Lecturer's student analysis |                       231.2 |
| Lecturer's student journal  |                       212.8 |

## Measurements

The comparison builds main at `7859fec` and this change, merged with that main, on the same machine, with `pnpm build` and `pnpm size`. Both use the compression and the complete dependency walk of decisions 0038 and 0042. kB means 1,000 bytes. Both languages count.

| Dependency set              | Main JavaScript | This change JavaScript | Main CSS | This change CSS |
| --------------------------- | --------------: | ---------------------: | -------: | --------------: |
| Shared code                 |          142.78 |                 142.97 |     7.90 |            7.85 |
| Class home                  |          235.42 |                 235.82 |    25.54 |           25.68 |
| Market                      |          220.84 |                 221.27 |    22.89 |           23.03 |
| Activity                    |          211.17 |                 211.39 |    20.18 |           20.14 |
| Demonstration summary       |          224.33 |                 224.73 |    23.26 |           23.39 |
| Demonstration Activity      |          212.03 |                 212.26 |    20.82 |           20.78 |
| Demonstration analysis      |          230.29 |                 230.50 |    22.66 |           22.64 |
| Student analysis            |          229.42 |                 229.63 |    22.03 |           22.01 |
| Stock                       |          230.40 |                 230.74 |    23.03 |           23.09 |
| Ticket                      |          238.17 |                 238.52 |    25.85 |           25.87 |
| Class ranking               |          206.40 |                 206.65 |    20.26 |           20.21 |
| Lecturer's student summary  |          225.13 |                 225.54 |    23.65 |           23.78 |
| Lecturer's student analysis |          230.78 |                 230.99 |    23.05 |           23.04 |
| Lecturer's student journal  |          212.33 |                 212.56 |    21.21 |           21.17 |

Every stylesheet set passes its ceiling, and every other JavaScript set passes its ceiling with more than 0.1 kB to spare.

## Alternatives

- Keep the earlier ceilings. The required dependency sets fail them.
- Leave the chip and the avatar on the screens that drew them before. The other screens would keep differing from their references.
- Raise every route ceiling. The other routes pass their ceilings with room to spare, so the allowances name only the measured routes that need them.

## Consequences

`scripts/client-route-limits.ts` keeps these allowances, and its tests check each of these ceilings.
