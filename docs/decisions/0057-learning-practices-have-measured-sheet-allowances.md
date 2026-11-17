# 0057. Learning practices have measured sheet allowances

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
- The guide omits the prototype's fixed reading duration because the app does not estimate how long its reader needs. It describes the stored quote after trading ends, because a quote is not a stored final daily close. Changes refer to the quoted day, including a quote from an earlier day. The quote example reuses `StockName` and can wrap its price column below the identity so its complete timestamp and amounts stay together on narrow screens. The pair list describes correlation rather than a frequency of matching directions. The two-stock card names its stocks through its controls and chart, without a second caption naming them.
- Complete sheets remain on their class routes. The following ceilings replace the earlier ceilings only for these dependency sets. Every other ceiling and the dependency walk stay the same. The named limits leave a small margin because the shared manifest and stylesheet splits also change compressed totals.

| Dependency set              | JavaScript ceiling, kB gzip | CSS ceiling, kB gzip |
| --------------------------- | --------------------------: | -------------------: |
| Shared code                 |                         141 |                   20 |
| Class home                  |                       227.5 |                 24.2 |
| Market                      |                       217.5 |                   22 |
| Activity                    |                         208 |                   20 |
| Demonstration summary       |                       221.5 |                   24 |
| Demonstration Activity      |                         209 |                   20 |
| Demonstration analysis      |                       223.5 |                 21.2 |
| Student analysis            |                       222.7 |                 20.6 |
| Stock                       |                       227.2 |                   22 |
| Ticket                      |                         235 |                 24.8 |
| Class ranking               |                       203.7 |                   20 |
| Lecturer's student summary  |                       222.5 |                   24 |
| Lecturer's student analysis |                         224 |                 21.6 |
| Lecturer's student journal  |                         209 |                 20.4 |

## Measurements

The asset comparison builds main at `2cabb13` from a clean archive and this change on the same machine, using `pnpm build` and `pnpm size`. Both use the compression and complete dependency walk of decisions 0038 and 0042. kB means 1,000 bytes. Both languages participate.

| Dependency set              | Main JavaScript | This change JavaScript | Main CSS | This change CSS |
| --------------------------- | --------------: | ---------------------: | -------: | --------------: |
| Shared code                 |          140.20 |                 140.73 |     7.50 |            7.50 |
| Lesson                      |          173.61 |                 194.51 |    15.00 |           16.99 |
| Price guide                 |                 |                 194.52 |          |           16.99 |
| Class home                  |          209.35 |                 227.25 |    22.58 |           24.10 |
| Market                      |          198.35 |                 216.98 |    20.32 |           21.83 |
| Activity                    |          193.73 |                 207.65 |    17.78 |           19.29 |
| Demonstration summary       |          203.48 |                 221.22 |    20.93 |           22.44 |
| Demonstration Activity      |          194.60 |                 208.52 |    18.36 |           19.86 |
| Demonstration analysis      |          202.82 |                 223.27 |    19.11 |           21.09 |
| Student analysis            |          201.96 |                 222.40 |    18.53 |           20.51 |
| Stock                       |          213.46 |                 226.66 |    20.49 |           22.00 |
| Ticket                      |          221.39 |                 234.42 |    23.27 |           24.77 |
| Class ranking               |          182.72 |                 203.40 |    17.63 |           19.62 |
| Lecturer's student summary  |          204.14 |                 222.02 |    21.33 |           22.84 |
| Lecturer's student analysis |          203.30 |                 223.75 |    19.51 |           21.49 |
| Lecturer's student journal  |          194.89 |                 208.81 |    18.76 |           20.27 |

The sheet reuses the allocation engine, rule calculations, and label placement. A direct import of the existing label styles replaces CSS composition that loaded their stylesheet twice. The complete lesson stylesheet set fell from 18.06 to 16.99 kB gzip. The final table includes that reduction.

The phone probe uses Chromium at 360 by 740 pixels with touch, fourfold CPU slowdown, a disabled cache, 150 ms latency, 200,000 bytes per second downstream, and 93,750 upstream. It takes three cold visits per route on each build, with copies of one sample database and the same synthetic student. The following values are medians in seconds. Lesson readiness waits for the heading on main and a slider in the new exercises. Ticket readiness waits for its hydrated form. Other routes wait for their heading.

| Route            | Main first contentful paint | Exercise first contentful paint | Main ready | Exercise ready |
| ---------------- | --------------------------: | ------------------------------: | ---------: | -------------: |
| Lesson 2         |                       2.020 |                           2.744 |      2.135 |          6.189 |
| Lesson 6         |                       2.048 |                           2.460 |      2.163 |          5.523 |
| Market           |                       3.172 |                           3.044 |      3.998 |          3.786 |
| Student analysis |                       2.948 |                           3.056 |      7.158 |          7.060 |
| Ticket           |                       4.156 |                           4.012 |     14.301 |         14.370 |
| Class home       |                       3.232 |                           3.548 |      3.402 |          4.024 |

The new lessons render their explanation, drawing, values, and tables before the sliders appear. These local samples do not establish a speedup or physical phone performance. Other workers used this machine during the probe, which limits a comparison of elapsed times. Phone timing preceded the final quote-example typography correction. [Issue #257](https://github.com/radenadam/portolab/issues/257) tracks the broader controlled phone comparison.

## Alternatives

- Removing exercises from sheets would make them differ from the approved prototype and their full pages.
- A deferred import can postpone a request, but it still counts in the complete dependency set.
- Separate chart and trading calculations would duplicate rules that existing screens already apply. The exercises reuse those implementations and their tests.
- Raising every route ceiling would also admit growth on unrelated pages. The allowances name only the measured routes that need them.

## Consequences

The lessons and guide retain native content, contextual help, keyboard controls, and tasks with a return to practice. Both languages and device projects exercise them. The sample already supplies measured stock pairs and stored fills, and its tests now require that data for these lessons.

The limits remain in `scripts/client-route-limits.ts`. Graph tests cover each named exception, both asset kinds, unchanged default limits for learning routes, and similarly named routes without allowances.
