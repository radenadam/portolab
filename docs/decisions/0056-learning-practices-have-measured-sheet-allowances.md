# 0056. Learning practices have measured sheet allowances

- Status: Accepted
- Date: 2026-11-17

## Context

Piece 30 of issue #127 fills the activities of sessions 2 and 6 and adds the price guide at the address of decision 0030. The approved prototype in [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) keeps the complete lessons in sheets. The layout of decision 0049 therefore carries their code on every class route.

The production rules differ from the prototype's mock bands. A portfolio can also have too few usable stocks for a pair, and a trading day can lack a recorded rule or reference close. The exercises need to explain those states without inventing inputs.

## Decision

- The price guide joins the Markdown prose exception of decision 0036. It has prose in each language, and its parser checks every translation and the common section structure. Values computed from quotes, rules, costs, and source descriptions remain Paraglide messages.
- The diversification exercise starts with equal weights and the observed correlation of a pair from the portfolio's shared months. When the portfolio cannot supply a pair, it uses eligible stored estimates as a labelled example. Changing correlation is a hypothesis, so it changes the covariance while retaining the stock estimates and months. Its range accepts the exact observed value before a reader changes it. The chart reuses the map's label placement, and its default drawing precedes JavaScript. Its variance calculation uses the existing double sum notation and four covariance terms, which keep the displayed inputs tied to the shared allocation calculation.
- The trading lesson and guide reuse the ticket's rules, reference price, and costs. The timeline reads the exchange calendar. It formats session numbers with Intl, which keeps them consistent with other numbered labels. The price exercise covers the recorded minimum price, including the small-price bands absent from the mock. The latest trade uses its stored fill costs and quote time.
- The Limit task asks the reader to cross ARA, read the price boundaries, and return without placing an order. It keeps the form's server validation policy. When the reference band is unavailable, it asks the reader to inspect the ticket's missing data instead. Missing rules retain the written lesson. The guide's task opens Market and returns to its practice section. A task opened in a sheet first opens the full lesson, as decision 0048 does.
- The guide omits the prototype's fixed reading duration because the app does not estimate how long its reader needs. The pair list describes correlation rather than a frequency of matching directions. The two-stock card names its stocks through its controls and chart, without a second caption naming them.
- Complete sheets remain on their class routes. The following ceilings replace the earlier ceilings only for these dependency sets. Every other ceiling and the dependency walk stay the same.

| Dependency set              | JavaScript ceiling, kB gzip | CSS ceiling, kB gzip |
| --------------------------- | --------------------------: | -------------------: |
| Shared code                 |                         141 |                   20 |
| Class home                  |                         227 |                 24.1 |
| Market                      |                       213.5 |                 21.5 |
| Activity                    |                         208 |                   20 |
| Demonstration summary       |                       221.5 |                   24 |
| Demonstration Activity      |                         209 |                   20 |
| Demonstration analysis      |                       223.5 |                 21.2 |
| Student analysis            |                       222.5 |                 20.6 |
| Stock                       |                       226.8 |                   22 |
| Ticket                      |                       234.5 |                 24.8 |
| Class ranking               |                       203.5 |                   20 |
| Lecturer's student summary  |                       222.5 |                   24 |
| Lecturer's student analysis |                       223.8 |                 21.6 |
| Lecturer's student journal  |                         209 |                 20.4 |

## Measurements

The asset comparison builds main at `21dce2a` from a clean archive and this change on the same machine, using `pnpm build` and `pnpm size`. Both use the compression and complete dependency walk of decisions 0038 and 0042. kB means 1,000 bytes. Both languages participate.

| Dependency set              | Main JavaScript | This change JavaScript | Main CSS | This change CSS |
| --------------------------- | --------------: | ---------------------: | -------: | --------------: |
| Shared code                 |          140.16 |                 140.72 |     7.50 |            7.50 |
| Lesson                      |          173.59 |                 194.51 |    15.00 |           16.98 |
| Price guide                 |                 |                 194.51 |          |           16.98 |
| Class home                  |          208.97 |                 226.92 |    22.58 |           24.09 |
| Market                      |          194.56 |                 213.22 |    19.93 |           21.43 |
| Activity                    |          193.70 |                 207.65 |    17.78 |           19.28 |
| Demonstration summary       |          203.38 |                 221.16 |    20.93 |           22.43 |
| Demonstration Activity      |          194.57 |                 208.52 |    18.36 |           19.86 |
| Demonstration analysis      |          202.52 |                 223.01 |    19.11 |           21.08 |
| Student analysis            |          201.65 |                 222.14 |    18.53 |           20.51 |
| Stock                       |          213.36 |                 226.59 |    20.39 |           21.89 |
| Ticket                      |          221.28 |                 234.35 |    23.16 |           24.66 |
| Class ranking               |          182.69 |                 203.40 |    17.63 |           19.61 |
| Lecturer's student summary  |          204.04 |                 221.96 |    21.33 |           22.83 |
| Lecturer's student analysis |          203.00 |                 223.49 |    19.51 |           21.48 |
| Lecturer's student journal  |          194.86 |                 208.81 |    18.76 |           20.26 |

The sheet reuses the allocation engine, rule calculations, and label placement. A direct import of the existing label styles replaces CSS composition that loaded their stylesheet twice. The complete lesson stylesheet set fell from 18.06 to 16.98 kB gzip. The final table includes that reduction.

The phone probe uses Chromium at 360 by 740 pixels with touch, fourfold CPU slowdown, a disabled cache, 150 ms latency, 200,000 bytes per second downstream, and 93,750 upstream. It takes three cold visits per route on each build, with copies of one sample database and the same synthetic student. The following values are medians in seconds. Lesson readiness waits for the heading on main and a slider in the new exercises. Ticket readiness waits for its hydrated form. Other routes wait for their heading.

| Route            | Main first contentful paint | Exercise first contentful paint | Main ready | Exercise ready |
| ---------------- | --------------------------: | ------------------------------: | ---------: | -------------: |
| Lesson 2         |                       1.924 |                           2.616 |      2.004 |          6.127 |
| Lesson 6         |                       2.032 |                           2.360 |      2.179 |          5.604 |
| Market           |                       3.628 |                           3.212 |      4.285 |          3.446 |
| Student analysis |                       3.984 |                           3.132 |      7.955 |          7.061 |
| Ticket           |                       4.940 |                           4.220 |     14.539 |         14.509 |
| Class home       |                       3.228 |                           3.360 |      3.341 |          3.519 |

The new lessons render their explanation, drawing, values, and tables before the sliders appear. These local samples do not establish a speedup or physical phone performance. Other workers used this machine during the probe, which limits a comparison of elapsed times. Phone timing preceded the final missing-quote notice change. [Issue #257](https://github.com/radenadam/portolab/issues/257) tracks the broader controlled phone comparison.

## Alternatives

- Removing exercises from sheets would make them differ from the approved prototype and their full pages.
- A deferred import can postpone a request, but it still counts in the complete dependency set.
- Separate chart and trading calculations would duplicate rules that existing screens already apply. The exercises reuse those implementations and their tests.
- Raising every route ceiling would also admit growth on unrelated pages. The allowances name only the measured routes that need them.

## Consequences

The lessons and guide retain native content, contextual help, keyboard controls, and tasks with a return to practice. Both languages and device projects exercise them. The sample already supplies measured stock pairs and stored fills, and its tests now require that data for these lessons.

The limits remain in `scripts/client-route-limits.ts`. Graph tests cover each named exception, both asset kinds, unchanged default limits for learning routes, and similarly named routes without allowances.
