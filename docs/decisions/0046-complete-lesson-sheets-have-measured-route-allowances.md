# 0046. Complete lesson sheets have measured route allowances

- Status: Accepted
- Date: 2026-11-16

## Context

The lesson sheets of [#243](https://github.com/radenadam/portolab/pull/243) share a layout above the class routes. Piece 23 fills the activities of sessions 9 and 10, so the sheet now includes the same exercises, formulas, maps, and portfolio inputs as the full lesson. The [approved prototype](0028-every-screen-follows-the-reference-screens-of-peta.md) also keeps those activities in its lesson sheets.

[Decision 0038](0038-client-javascript-is-budgeted-by-route.md) counts a complete dependency set, including deferred imports. [Decision 0042](0042-client-css-is-budgeted-by-route.md) does the same for CSS. Their checks therefore count the exercises on every route beneath the sheet layout, even before a student opens a sheet.

The baseline is main at `d21ebd1`, measured by successful Check run [43744274235](https://github.com/radenadam/portolab/actions/runs/43744274235). The combined build at `dc23fef` uses `pnpm build` and `pnpm size`, with the gzip method of decision 0038. Later measurements of the final build are recorded with the pull request.

| Dependency set               | JavaScript before, kB gzip | JavaScript after, kB gzip | CSS before, kB gzip | CSS after, kB gzip |
| ---------------------------- | -------------------------: | ------------------------: | ------------------: | -----------------: |
| Shared code                  |                     138.96 |                    139.42 |                7.70 |               7.74 |
| Lesson                       |                     144.69 |                    173.12 |               10.01 |              15.43 |
| Class home                   |                     192.30 |                    204.16 |               18.99 |              21.96 |
| Ticket                       |                     187.78 |                    207.48 |               17.44 |              21.95 |
| Market                       |                     168.67 |                    192.70 |               15.58 |              20.08 |
| Lecturer's student portfolio |                     163.61 |                    188.84 |               15.46 |              20.52 |

## Decision

- The complete class home and ticket routes have a JavaScript ceiling of 220 kB gzip.
- The complete class home, ticket, market, and lecturer's student portfolio routes have a CSS ceiling of 24 kB gzip.
- These allowances apply only to the named route ids in `clientRouteLimits`. Every other route and the shared dependency set retain their earlier ceilings. A new route still gets its budget without a handwritten entry, and it gets no exception by its name's prefix.
- The graph walk and compression method stay the same. Static imports, deferred imports, ancestor layouts, and assets without a route owner still count.

The allowances cover the approved sheet experience. The largest measured JavaScript set leaves 12.52 kB below its ceiling, and the largest CSS set leaves 2.04 kB. Both languages remain in each measurement. The phone profile uses Chromium at 360 pixels with touch, fourfold CPU slowdown, a disabled cache, 150 ms network latency, 200,000 bytes per second downstream, and 93,750 upstream. It uses `storeLessonPortfolio`, with two recorded stocks, and takes three cold visits to each route. The timestamp is `performance.now()` after the relevant ready state. The ticket waits for `data-ticket-ready`, and the new lessons wait for a slider. The baseline lessons and class home wait for their visible heading after load.

| Route      | Main median first contentful paint, seconds | Exercise median first contentful paint, seconds | Main median ready time, seconds | Exercise median ready time, seconds |
| ---------- | ------------------------------------------: | ----------------------------------------------: | ------------------------------: | ----------------------------------: |
| Lesson 9   |                                       1.420 |                                           2.076 |                           3.265 |                               4.864 |
| Lesson 10  |                                       1.432 |                                           2.040 |                           3.273 |                               4.861 |
| Ticket     |                                       2.504 |                                           2.824 |                           7.575 |                               8.148 |
| Class home |                                       2.244 |                                           2.360 |                           5.189 |                               5.628 |

The new lesson controls are ready within five seconds in these samples. A slider key step takes between 66 and 90 ms, including Playwright and two animation frames. The existing ticket's median ready time grows by 0.573 seconds, and the class home's by 0.439 seconds. This bounded increase and the responsive calculations support retaining the complete sheets with these allowances. These are local emulation measurements for the recorded two-stock fixture.

## Alternatives

- **Remove the exercises from sheets.** This would make a lesson opened over an order differ from the approved prototype and from its full page.
- **Defer the exercise import.** It can postpone the network request, but the existing check still counts it. It cannot resolve the complete dependency budget.
- **Replace the shared chart and formula components.** Separate smaller versions would repeat calculations, notation, and layout code that the exercise reuses today.
- **Raise every route and shared ceiling.** Routes without this measured need keep their existing bounds instead.

## Consequences

`clientSizeChecks` reads the route limits from `clientRouteLimits`. Its tests cover each exception, each asset kind, the lesson's unchanged limits, and a similar route name that gets no allowance. The existing graph tests retain their checks of inherited and deferred assets. A later increase still needs measurements and a decision.
