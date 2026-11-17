# 0049. Complete lesson sheets have measured route allowances

- Status: Accepted. [Decision 0053](0053-current-returns-share-one-snapshot.md) replaces its rule that demonstration analysis keeps the default JavaScript ceiling. [Decision 0054](0054-trade-impact-has-measured-allowances-for-its-combined-screens.md) replaces its JavaScript ceiling for the ticket. It also replaces its consequences that shared JavaScript keeps its earlier ceiling, the stock page keeps the default JavaScript and CSS ceilings, and student analysis keeps the default JavaScript ceiling. [Decision 0058](0058-analysis-panels-have-measured-route-allowances.md) replaces its consequence that the lecturer's student analysis and demonstration analysis keep the default CSS ceiling.
- Date: 2026-11-16

## Context

The lesson sheets of [#243](https://github.com/radenadam/portolab/pull/243) share a layout above the class routes. Piece 23 fills the activities of sessions 9 and 10, so the sheet includes the same exercises, formulas, maps, and portfolio inputs as the full lesson. The [approved prototype](0028-every-screen-follows-the-reference-screens-of-peta.md) also keeps those activities in its sheets. The read-only student tabs of [#239](https://github.com/radenadam/portolab/pull/239) inherit that layout too.

[Decision 0038](0038-client-javascript-is-budgeted-by-route.md) counts a complete dependency set, including deferred imports. [Decision 0042](0042-client-css-is-budgeted-by-route.md) does the same for CSS. Their checks therefore count these exercises on every route beneath the sheet layout, even before a reader opens a sheet.

Local production builds of main at `a7b1961` and the merged change give these complete dependency sets. Both use `pnpm build` and `pnpm size` on the same machine, with the gzip method of decision 0038. The sets include both languages.

| Dependency set              | JavaScript before, kB gzip | JavaScript after, kB gzip | CSS before, kB gzip | CSS after, kB gzip |
| --------------------------- | -------------------------: | ------------------------: | ------------------: | -----------------: |
| Shared code                 |                     138.82 |                    139.62 |                7.44 |               7.47 |
| Lesson                      |                     144.54 |                    173.34 |                9.75 |              15.19 |
| Class home                  |                     194.37 |                    206.47 |               19.78 |              22.75 |
| Ticket                      |                     188.25 |                    208.25 |               17.09 |              21.62 |
| Market                      |                     168.38 |                    192.72 |               15.16 |              19.67 |
| Student analysis            |                     187.16 |                    198.60 |               15.70 |              18.66 |
| Lecturer's student summary  |                     190.75 |                    202.63 |               18.48 |              21.45 |
| Lecturer's student analysis |                     189.23 |                    200.33 |               16.67 |              19.64 |
| Lecturer's student journal  |                     165.02 |                    193.16 |               13.66 |              18.72 |
| Demonstration summary       |                     189.48 |                    201.69 |               18.08 |              21.05 |
| Demonstration analysis      |                     188.03 |                    199.47 |               16.27 |              19.24 |

## Decision

- The complete class home, ticket, lecturer's student summary, lecturer's student analysis, and demonstration summary routes have a JavaScript ceiling of 220 kB gzip.
- The complete class home, ticket, lecturer's student summary, and demonstration summary routes have a CSS ceiling of 24 kB gzip. This replaces the class overview ceiling of decision 0046.
- The allowances apply only to the named route ids in `clientRouteLimits`. Other routes and both shared sets keep their existing ceilings. A new route gets its budget without a handwritten entry, and it gets no exception by its name's prefix.
- The graph walk and compression method stay the same. Static imports, deferred imports, ancestor layouts, and assets without a route owner still count.

The phone comparison uses Chromium at 360 pixels with touch, fourfold CPU slowdown, a disabled cache, 150 ms network latency, 200,000 bytes per second downstream, and 93,750 upstream. It uses the same two recorded stocks from `storeLessonPortfolio` and takes three cold visits to each route on each build. Ready time is `performance.now()` after navigation finishes loading and the relevant visible state appears. The ticket waits for `data-ticket-ready`. The new lessons wait for a slider. The baseline lessons and the other pages wait for their heading.

| Route                       | Main median first contentful paint, seconds | Exercise median first contentful paint, seconds | Main median ready time, seconds | Exercise median ready time, seconds |
| --------------------------- | ------------------------------------------: | ----------------------------------------------: | ------------------------------: | ----------------------------------: |
| Lesson 9                    |                                       1.472 |                                           2.084 |                           3.172 |                               4.693 |
| Lesson 10                   |                                       1.432 |                                           2.088 |                           3.135 |                               4.645 |
| Ticket                      |                                       2.556 |                                           2.840 |                           6.725 |                               7.436 |
| Class home                  |                                       2.328 |                                           2.420 |                           5.109 |                               5.496 |
| Lecturer's student summary  |                                       2.384 |                                           2.480 |                           5.083 |                               5.550 |
| Lecturer's student analysis |                                       2.624 |                                           2.860 |                           6.262 |                               6.706 |
| Lecturer's student journal  |                                       1.788 |                                           2.080 |                           4.183 |                               5.024 |

The read-only pages' measured ready-time increases stay below one second. The six recorded slider key steps all finish within 129 ms, including Playwright and two animation frames. These results support keeping the complete activities in sheets with these allowances. They are local emulation measurements for the recorded two-stock fixture, and they do not measure every portfolio or phone.

## Alternatives

- **Remove the exercises from sheets.** A lesson opened over an order would differ from the approved prototype and from its full page.
- **Defer the exercise import.** This can postpone a network request, but the existing check still counts the import. It cannot resolve the complete dependency budget.
- **Replace the shared chart and formula components.** Separate smaller versions would repeat calculations, notation, and layout code that the exercises reuse today.
- **Raise every route ceiling.** The measurements support allowances for the named routes, while the others fit their existing bounds.

## Consequences

The current limits live in `scripts/client-route-limits.ts`. `clientSizeChecks` reads them through `clientRouteLimits`. Its tests cover each exception, each asset kind, the unchanged lesson and shared limits, and similar route names that get no allowance. The existing graph tests retain their checks of inherited and deferred assets.
