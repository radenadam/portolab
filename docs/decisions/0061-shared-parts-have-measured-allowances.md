# 0061. Shared parts have measured allowances

- Status: Accepted
- Date: 2026-11-18

## Context

Issues #287 and #289 list the parts that many screens share and that still differ from the references of [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md). The axis of returns of every map marks about six signed values, the IHSG of Pasar shows its change in the tinted chip of a stock, the menu of the profile shows the avatar beside the name, and the theme holds one primary button and one text that only a screen reader reads.

The chip, the avatar, and the format of signed marks are new code on every route that shows them. The frame and the menu of the profile load on every route, so shared JavaScript grows as well. No dependency is added, and the stylesheets of the screens shrink where they no longer repeat the looks that the theme now holds.

## Decision

The following ceilings replace the ceilings of [decision 0060](0060-learning-practices-have-measured-sheet-allowances.md) only for these dependency sets. Every other ceiling and the complete dependency walk of decisions [0038](0038-client-javascript-is-budgeted-by-route.md) and [0042](0042-client-css-is-budgeted-by-route.md) keep their rules.

| Dependency set             | JavaScript ceiling, kB gzip |
| -------------------------- | --------------------------: |
| Shared code                |                       142.8 |
| Class home                 |                       235.5 |
| Market                     |                       220.1 |
| Demonstration summary      |                       224.4 |
| Stock                      |                       229.8 |
| Ticket                     |                       237.5 |
| Lecturer's student summary |                       225.2 |

## Measurements

The comparison builds main at `0bb55f0` and this change, merged with that main, on the same machine, with `pnpm build` and `pnpm size`. Both use the compression and the complete dependency walk of decisions 0038 and 0042. kB means 1,000 bytes. Both languages count.

| Dependency set             | Main JavaScript | This change JavaScript | Main CSS | This change CSS |
| -------------------------- | --------------: | ---------------------: | -------: | --------------: |
| Shared code                |          142.50 |                 142.66 |     7.83 |            7.82 |
| Class home                 |          234.94 |                 235.35 |    25.41 |           25.55 |
| Market                     |          219.56 |                 219.96 |    22.45 |           22.57 |
| Demonstration summary      |          223.85 |                 224.26 |    23.13 |           23.25 |
| Stock                      |          229.25 |                 229.60 |    22.63 |           22.63 |
| Ticket                     |          237.02 |                 237.38 |    25.46 |           25.41 |
| Lecturer's student summary |          224.65 |                 225.07 |    23.52 |           23.65 |

Every other dependency set passes its ceiling, and every stylesheet set passes its ceiling.

## Alternatives

- Keep the earlier ceilings. The required dependency sets fail them.
- Leave the chip and the avatar on the screens that drew them before. The other screens would keep differing from their references.
- Raise every route ceiling. The other routes pass their ceilings, so the allowances name only the measured routes that need them.

## Consequences

`scripts/client-route-limits.ts` keeps these allowances, and its tests check each of these ceilings.
