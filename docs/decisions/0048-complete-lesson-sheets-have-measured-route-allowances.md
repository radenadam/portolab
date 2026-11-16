# 0048. Complete lesson sheets have measured route allowances

- Status: Accepted
- Date: 2026-11-16

## Context

The lesson sheets of [#243](https://github.com/radenadam/portolab/pull/243) share a layout above the class routes. Piece 23 fills the activities of sessions 9 and 10, so the sheet now includes the same exercises, formulas, maps, and portfolio inputs as the full lesson. The [approved prototype](0028-every-screen-follows-the-reference-screens-of-peta.md) also keeps those activities in its lesson sheets.

[Decision 0038](0038-client-javascript-is-budgeted-by-route.md) counts a complete dependency set, including deferred imports. [Decision 0042](0042-client-css-is-budgeted-by-route.md) does the same for CSS. Their checks therefore count the exercises on every route beneath the sheet layout, even before a student opens a sheet.

After the demonstration portfolio merged, production builds of main at `1a0ccf5` and the combined change give these complete dependency sets. Both use `pnpm build` and `pnpm size`, with the gzip method of decision 0038. Later measurements of the final build are recorded with the pull request.

| Dependency set               | JavaScript before, kB gzip | JavaScript after, kB gzip | CSS before, kB gzip | CSS after, kB gzip |
| ---------------------------- | -------------------------: | ------------------------: | ------------------: | -----------------: |
| Shared code                  |                     139.91 |                    140.34 |                7.80 |               7.84 |
| Lesson                       |                     145.64 |                    174.23 |               10.11 |              15.53 |
| Class home                   |                     196.13 |                    207.97 |               20.46 |              23.43 |
| Ticket                       |                     189.37 |                    209.09 |               17.54 |              22.06 |
| Market                       |                     169.63 |                    193.83 |               15.69 |              20.18 |
| Lecturer's student portfolio |                     164.64 |                    189.97 |               15.56 |              20.62 |
| Student analysis             |                     190.32 |                    201.21 |               16.71 |              19.68 |
| Demonstration summary        |                     191.28 |                    203.23 |               18.73 |              21.70 |
| Demonstration analysis       |                     191.17 |                    202.06 |               17.09 |              20.06 |

The demonstration pages inherit the same lesson sheets. Their increases therefore come from the same complete exercises. The shared set adds 0.43 kB. Its browser route manifest grows by 316 bytes gzip at level 9, because it lists the exercises' additional chunks. The rest comes mainly from the practice icons and query-only return addresses. The shared set imports no exercise or chart.

## Decision

- The complete class home, ticket, student analysis, demonstration summary, and demonstration analysis routes have a JavaScript ceiling of 220 kB gzip.
- The complete class home, ticket, market, lecturer's student portfolio, demonstration summary, and demonstration analysis routes have a CSS ceiling of 24 kB gzip. This replaces the class overview ceiling of decision 0046.
- Shared JavaScript has a ceiling of 141 kB gzip, which admits its measured 0.43 kB increase.
- The route allowances apply only to the named route ids in `clientRouteLimits`. Every other route and shared CSS retain their earlier ceilings. A new route still gets its budget without a handwritten entry, and it gets no exception by its name's prefix.
- The graph walk and compression method stay the same. Static imports, deferred imports, ancestor layouts, and assets without a route owner still count.

The allowances cover the approved sheet experience. The largest measured JavaScript set leaves 10.91 kB below its ceiling, and the largest CSS set leaves 0.57 kB. Both languages remain in each measurement. The phone profile uses Chromium at 360 pixels with touch, fourfold CPU slowdown, a disabled cache, 150 ms network latency, 200,000 bytes per second downstream, and 93,750 upstream. It uses `storeLessonPortfolio`, with two recorded stocks, and takes three cold visits to each route. The timestamp is `performance.now()` after the relevant ready state. The ticket waits for `data-ticket-ready`, and the new lessons wait for a slider. The baseline lessons and class home wait for their visible heading after load.

| Route      | Main median first contentful paint, seconds | Exercise median first contentful paint, seconds | Main median ready time, seconds | Exercise median ready time, seconds |
| ---------- | ------------------------------------------: | ----------------------------------------------: | ------------------------------: | ----------------------------------: |
| Lesson 9   |                                       1.512 |                                           2.136 |                           3.355 |                               5.173 |
| Lesson 10  |                                       1.512 |                                           2.100 |                           3.466 |                               5.153 |
| Ticket     |                                       2.824 |                                           3.076 |                           9.061 |                               9.853 |
| Class home |                                       2.424 |                                           2.492 |                           5.509 |                               5.952 |

The exercise data and controls increase the lesson ready times. A slider key step takes between 83 and 127 ms, including Playwright and two animation frames. The existing ticket's median ready time grows by 0.792 seconds, and the class home's by 0.443 seconds. This bounded increase and the responsive calculations support retaining the complete sheets with these allowances. These are local emulation measurements for the recorded two-stock fixture.

## Alternatives

- **Remove the exercises from sheets.** This would make a lesson opened over an order differ from the approved prototype and from its full page.
- **Defer the exercise import.** It can postpone the network request, but the existing check still counts it. It cannot resolve the complete dependency budget.
- **Replace the shared chart and formula components.** Separate smaller versions would repeat calculations, notation, and layout code that the exercise reuses today.
- **Raise every route ceiling.** Routes without this measured need keep their existing bounds instead.
- **Leave the shared ceiling at 140 kB.** The generated route manifest accounts for most of its small increase. Removing an exercise or replacing routing to recover those bytes would change the approved experience. The new ceiling admits less than one additional kilobyte beyond the measured shared set.

## Consequences

The current limits live in `scripts/client-route-limits.ts`. `clientSizeChecks` reads them through `clientRouteLimits`. Its tests cover each exception, each asset kind, the lesson's unchanged limits, and a similar route name that gets no allowance. The existing graph tests retain their checks of inherited and deferred assets. A later increase still needs measurements and a decision.
