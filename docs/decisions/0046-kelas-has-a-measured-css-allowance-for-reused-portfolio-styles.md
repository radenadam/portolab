# 0046. Kelas has a measured CSS allowance for reused portfolio styles

- Status: Accepted. [Decision 0048](0048-complete-lesson-sheets-have-measured-route-allowances.md) replaces its CSS ceiling for the class overview route and the location of the route allowances.
- Date: 2026-11-16

## Context

The demonstration portfolio reuses Beranda instead of copying its screen. Before this reuse, Vite put Beranda and Kelas styles in one route stylesheet because both roles open the same class address. The second consumer makes Vite split the portfolio styles into a shared stylesheet. Kelas still loads both sets, but compressing the files apart costs more than compressing them together.

Production builds of main `4fa3eda` and piece 33 use `pnpm build` and `pnpm size`, with the compression method and complete dependency sets of [decision 0038](0038-client-javascript-is-budgeted-by-route.md) and [decision 0042](0042-client-css-is-budgeted-by-route.md).

| Dependency set | Main, kB gzip | Piece 33, kB gzip |
| -------------- | ------------: | ----------------: |
| Shared CSS     |          7.70 |              7.80 |
| Kelas CSS      |         19.75 |             20.46 |
| All client CSS |         32.20 |             33.29 |

The Kelas asset lists have the same shared styles except for the lesson return anchor. Its stylesheet costs 101 bytes gzip. The former combined route stylesheet becomes separate class and portfolio stylesheets, which account for the rest of the increase. No class or portfolio layout rule is added by that split.

The same build exceeded shared JavaScript by one byte. Navigation asked for a portfolio address through a helper that also computed its localized title. Separating the address from the title brings shared JavaScript to 139.91 kB, below its existing ceiling.

## Decision

The complete CSS dependency set of `features/classes/class-page` has a ceiling of 21 kB gzip. Every other route, including root and children of the class route, keeps the ceiling of decision 0042. The exception lives in `scripts/client-size.ts`, and a test checks its exact route, complete asset set, and isolation from other routes. JavaScript ceilings stay unchanged.

Kelas loads 0.71 kB more CSS than main, mostly because the same styles are compressed in separate files. The 360-pixel layout and visual checks still cover both roles. This allowance admits the reused Peta screen and leaves the rest of the phone guard in place. A byte ceiling does not promise a loading time on a particular phone.

## Alternatives

- Copy Beranda into the demonstration to keep its original chunk private. This would duplicate the screen and its styles.
- Load class and portfolio styles globally to combine their compression. Other routes would then carry styles that they do not use.
- Refactor the established class and portfolio styles to remove enough bytes. The measured increase comes from splitting their compression, so this would expand the rebuild into changes to existing layouts.
- Raise every CSS ceiling. Only Kelas exceeds its ceiling, so the other routes need no allowance.

## Consequences

The size check still counts every ancestor, shared import, deferred import, and unowned stylesheet. The allowance changes one ceiling and hides no asset. A later increase must pass that ceiling or justify another measured decision.
