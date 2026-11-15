# 0046. Complete lesson sheets have measured route allowances

- Status: Accepted
- Date: 2026-11-16

## Context

The lesson sheets of [#243](https://github.com/radenadam/portolab/pull/243) share a layout above the class routes. Piece 23 fills the activities of sessions 9 and 10, so the sheet now includes the same exercises, formulas, maps, and portfolio inputs as the full lesson. The [approved prototype](0028-every-screen-follows-the-reference-screens-of-peta.md) also keeps those activities in its lesson sheets.

[Decision 0038](0038-client-javascript-is-budgeted-by-route.md) counts a complete dependency set, including deferred imports. [Decision 0042](0042-client-css-is-budgeted-by-route.md) does the same for CSS. Their checks therefore count the exercises on every route beneath the sheet layout, even before a student opens a sheet.

The baseline is main at `4fa3eda`. Both that source and the combined build at `7f98074` use `pnpm build` and `pnpm size`, with the gzip method of decision 0038. Later measurements of the final build are recorded with the pull request.

| Dependency set               | JavaScript before, kB gzip | JavaScript after, kB gzip | CSS before, kB gzip | CSS after, kB gzip |
| ---------------------------- | -------------------------: | ------------------------: | ------------------: | -----------------: |
| Shared code                  |                     138.98 |                    139.44 |                7.70 |               7.74 |
| Lesson                       |                     144.71 |                    173.22 |               10.01 |              15.43 |
| Class home                   |                     193.60 |                    205.53 |               19.75 |              22.72 |
| Ticket                       |                     187.81 |                    207.57 |               17.44 |              21.95 |
| Market                       |                     168.70 |                    192.81 |               15.58 |              20.08 |
| Lecturer's student portfolio |                     163.62 |                    188.94 |               15.46 |              20.52 |

## Decision

- The complete class home and ticket routes have a JavaScript ceiling of 220 kB gzip.
- The complete class home, ticket, market, and lecturer's student portfolio routes have a CSS ceiling of 24 kB gzip.
- These allowances apply only to the named route ids in `clientRouteLimits`. Every other route and the shared dependency set retain their earlier ceilings. A new route still gets its budget without a handwritten entry, and it gets no exception by its name's prefix.
- The graph walk and compression method stay the same. Static imports, deferred imports, ancestor layouts, and assets without a route owner still count.

The allowances cover the approved sheet experience. The largest measured JavaScript set leaves 12.43 kB below its ceiling, and the largest CSS set leaves 1.28 kB. Both languages remain in each measurement. The phone profile uses Chromium at 360 pixels with touch, fourfold CPU slowdown, a disabled cache, 150 ms network latency, 200,000 bytes per second downstream, and 93,750 upstream. It uses `storeLessonPortfolio`, with two recorded stocks, and takes three cold visits to each route. The timestamp is `performance.now()` after the relevant ready state. The ticket waits for `data-ticket-ready`, and the new lessons wait for a slider. The baseline lessons and class home wait for their visible heading after load.

| Route      | Main median first contentful paint, seconds | Exercise median first contentful paint, seconds | Main median ready time, seconds | Exercise median ready time, seconds |
| ---------- | ------------------------------------------: | ----------------------------------------------: | ------------------------------: | ----------------------------------: |
| Lesson 9   |                                       1.408 |                                           2.072 |                           3.262 |                               4.866 |
| Lesson 10  |                                       1.416 |                                           2.116 |                           3.253 |                               5.389 |
| Ticket     |                                       2.520 |                                           2.860 |                           7.531 |                               8.203 |
| Class home |                                       2.220 |                                           2.416 |                           5.244 |                               5.696 |

The exercise data and controls increase the lesson ready times. A slider key step takes between 71 and 173 ms, including Playwright and two animation frames. The existing ticket's median ready time grows by 0.672 seconds, and the class home's by 0.452 seconds. This bounded increase and the responsive calculations support retaining the complete sheets with these allowances. These are local emulation measurements for the recorded two-stock fixture.

## Alternatives

- **Remove the exercises from sheets.** This would make a lesson opened over an order differ from the approved prototype and from its full page.
- **Defer the exercise import.** It can postpone the network request, but the existing check still counts it. It cannot resolve the complete dependency budget.
- **Replace the shared chart and formula components.** Separate smaller versions would repeat calculations, notation, and layout code that the exercise reuses today.
- **Raise every route and shared ceiling.** Routes without this measured need keep their existing bounds instead.

## Consequences

`clientSizeChecks` reads the route limits from `clientRouteLimits`. Its tests cover each exception, each asset kind, the lesson's unchanged limits, and a similar route name that gets no allowance. The existing graph tests retain their checks of inherited and deferred assets. A later increase still needs measurements and a decision.
