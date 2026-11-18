# 0067. Shared parts have measured allowances

- Status: Accepted
- Date: 2026-11-18

## Context

Issues #287 and #289 list the parts that many screens share and that still differ from the references of [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md). The axis of returns of every map marks about six signed values, the IHSG of Pasar shows its change in the tinted chip of a stock, the menu of the profile shows the avatar beside the name, and the theme holds one primary button.

The chip, the avatar, and the format of signed marks are new code on every route that shows them. The frame and the menu of the profile load on every route, and the screens of the lecturer draw the avatar of a student through the same component, so the build puts the avatar in a chunk and a stylesheet of their own. Shared JavaScript grows by about 0.44 kB and shared CSS by about 0.1 kB, and every route grows with them. No dependency is added, and the stylesheets of the screens shrink where they no longer repeat the looks that the theme and the shared modules now hold.

## Decision

The following ceilings replace the ceilings of [decision 0065](0065-the-welcome-has-measured-shared-and-route-allowances.md) only for these dependency sets. An empty cell keeps the earlier CSS ceiling. Every other ceiling and the complete dependency walk of decisions [0038](0038-client-javascript-is-budgeted-by-route.md) and [0042](0042-client-css-is-budgeted-by-route.md) keep their rules. Each new ceiling leaves at least 0.1 kB of JavaScript or 0.05 kB of CSS above the measured set, because the hashes of another build change compressed totals by tens of bytes.

| Dependency set              | JavaScript ceiling, kB gzip | CSS ceiling, kB gzip |
| --------------------------- | --------------------------: | -------------------: |
| Shared code                 |                       143.7 |                      |
| Class home                  |                       241.7 |                 27.9 |
| Market                      |                       222.1 |                 23.6 |
| Activity                    |                       212.3 |                      |
| Demonstration summary       |                       226.3 |                      |
| Demonstration Activity      |                       213.1 |                      |
| Demonstration analysis      |                       231.4 |                      |
| Student analysis            |                       230.5 |                      |
| Stock                       |                       232.1 |                 23.9 |
| Ticket                      |                       239.8 |                      |
| Class ranking               |                       207.6 |                      |
| Lecturer's student summary  |                       227.2 |                 24.3 |
| Lecturer's student analysis |                       232.0 |                      |
| Lecturer's student journal  |                       213.6 |                      |

## Measurements

The comparison builds main at `40c4deb` and this change, merged with that main, on the same machine, with `pnpm build` and `pnpm size`. Both use the compression and the complete dependency walk of decisions 0038 and 0042. kB means 1,000 bytes. Both languages count.

| Dependency set              | Main JavaScript | This change JavaScript | Main CSS | This change CSS |
| --------------------------- | --------------: | ---------------------: | -------: | --------------: |
| Shared code                 |          143.13 |                 143.57 |     8.16 |            8.26 |
| Class home                  |          240.89 |                 241.55 |    27.41 |           27.74 |
| Market                      |          221.30 |                 221.98 |    23.15 |           23.44 |
| Activity                    |          211.63 |                 212.11 |    20.44 |           20.55 |
| Demonstration summary       |          225.48 |                 226.13 |    23.57 |           23.85 |
| Demonstration Activity      |          212.50 |                 212.98 |    21.08 |           21.19 |
| Demonstration analysis      |          230.74 |                 231.22 |    22.92 |           23.06 |
| Student analysis            |          229.87 |                 230.35 |    22.29 |           22.42 |
| Stock                       |          231.27 |                 231.90 |    23.54 |           23.75 |
| Ticket                      |          239.04 |                 239.68 |    26.36 |           26.53 |
| Class ranking               |          206.89 |                 207.41 |    20.52 |           20.57 |
| Lecturer's student summary  |          226.37 |                 227.03 |    23.99 |           24.20 |
| Lecturer's student analysis |          231.31 |                 231.80 |    23.34 |           23.41 |
| Lecturer's student journal  |          212.88 |                 213.36 |    21.50 |           21.54 |

Every other stylesheet set passes its ceiling with at least 0.05 kB to spare, and every other JavaScript set passes its ceiling with at least 0.1 kB to spare.

## Alternatives

- Keep the earlier ceilings. The required dependency sets fail them.
- Leave the chip and the avatar on the screens that drew them before. The other screens would keep differing from their references.
- Draw the avatars of the lecturer's screens with their own markup, which keeps the avatar in the chunk of the frame. Their initials would stay apart from the one component, and a copy of its markup had already drawn them off center.
- Raise every route ceiling. The other routes pass their ceilings with room to spare, so the allowances name only the measured routes that need them.

## Consequences

`scripts/client-route-limits.ts` keeps these allowances, and its tests check each of these ceilings.
