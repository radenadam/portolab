# 0059. Learning practices have measured sheet allowances

- Status: Accepted
- Date: 2026-11-17

## Context

Piece 30 of issue #127 fills the activities of sessions 2 and 6 and adds the price guide at the address of decision 0030. The approved prototype in [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) keeps the complete lessons in sheets. The layout of decision 0049 therefore carries their code on every class route.

The production rules differ from the prototype's mock bands. A portfolio can also have too few usable stocks for a pair, and a trading day can lack a recorded rule or reference close. The exercises need to explain those states without inventing inputs.

## Decision

- The price guide joins the Markdown prose exception of decision 0036. It has prose in each language, and its parser checks every translation and the common section structure. Values computed from quotes, rules, costs, and source descriptions remain Paraglide messages.
- The diversification exercise starts with equal weights and the observed correlation of a pair from the portfolio's shared months. When the portfolio cannot supply a pair, it uses eligible stored estimates as a labelled example. Changing correlation is a hypothesis, so it changes the covariance while retaining the stock estimates and months. Its range accepts the exact observed value before a reader changes it. The chart reuses the map's label placement, and its default drawing precedes JavaScript. Its formula writes the risk of two stocks with their correlation, as the prototype does, with the subscripts of [decision 0020](0020-a-formula-shows-the-notation-of-the-textbooks.md), so the reader sees where the correlation of the slider enters.
- The trading lesson and guide reuse the ticket's rules, reference price, and costs. The timeline reads the exchange calendar. It formats session numbers with Intl, which keeps them consistent with other numbered labels. It names the times of each session under the day of that session instead of the prototype's single axis, because that axis gives only the times of Monday to Thursday, and the English times of an axis, such as 12:00 PM and 1:30 PM, collide at 360 pixels. The price exercise covers the recorded minimum price, including the small-price bands absent from the mock. The latest trade uses its stored fill costs and quote time.
- The Limit task asks the reader to cross ARA, read the price boundaries, and return without placing an order. It keeps the form's server validation policy. When the reference band is unavailable, it asks the reader to inspect the ticket's missing data instead. Missing rules retain the written lesson. The guide's task opens Market and returns to its practice section. A task opened in a sheet first opens the full lesson, as decision 0048 does.
- The guide omits the prototype's fixed reading duration because the app does not estimate how long its reader needs. It describes the stored quote after trading ends, because a quote is not a stored final daily close. Changes refer to the quoted day, including a quote from an earlier day. The quote example reuses `StockName` and can wrap its price column below the identity so its complete timestamp and amounts stay together on narrow screens. The pair list describes correlation rather than a frequency of matching directions. The two-stock card names its stocks through its controls and chart, without a second caption naming them.
- Complete sheets remain on their class routes. The following ceilings replace the earlier ceilings only for these dependency sets. Every other ceiling and the dependency walk stay the same. The named limits leave a small margin because the shared manifest and stylesheet splits also change compressed totals.

| Dependency set              | JavaScript ceiling, kB gzip | CSS ceiling, kB gzip |
| --------------------------- | --------------------------: | -------------------: |
| Shared code                 |                       142.6 |                   20 |
| Class home                  |                       234.9 |                 25.2 |
| Market                      |                       219.5 |                 22.3 |
| Activity                    |                       210.8 |                   20 |
| Demonstration summary       |                       223.8 |                   24 |
| Demonstration Activity      |                       211.6 |                 20.4 |
| Demonstration analysis      |                       225.8 |                 21.6 |
| Student analysis            |                       224.9 |                 20.9 |
| Stock                       |                       229.2 |                 22.5 |
| Ticket                      |                       236.9 |                 25.3 |
| Class ranking               |                       205.9 |                   20 |
| Lecturer's student summary  |                       224.6 |                   24 |
| Lecturer's student analysis |                       226.3 |                 21.9 |
| Lecturer's student journal  |                       211.9 |                 20.8 |

## Measurements

The asset comparison builds main at `a51f11c` from a clean archive and this change, merged with that main, on the same machine, using `pnpm build` and `pnpm size`. Both use the compression and complete dependency walk of decisions 0038 and 0042. kB means 1,000 bytes. Both languages participate.

| Dependency set              | Main JavaScript | This change JavaScript | Main CSS | This change CSS |
| --------------------------- | --------------: | ---------------------: | -------: | --------------: |
| Shared code                 |          141.94 |                 142.47 |     7.76 |            7.80 |
| Lesson                      |          175.35 |                 196.81 |    15.26 |           17.06 |
| Price guide                 |                 |                 196.82 |          |           17.06 |
| Class home                  |          220.44 |                 234.64 |    23.58 |           24.91 |
| Market                      |          200.13 |                 219.27 |    20.63 |           21.95 |
| Activity                    |          196.05 |                 210.48 |    18.29 |           19.62 |
| Demonstration summary       |          205.26 |                 223.56 |    21.31 |           22.63 |
| Demonstration Activity      |          196.92 |                 211.35 |    18.93 |           20.25 |
| Demonstration analysis      |          204.59 |                 225.59 |    19.43 |           21.23 |
| Student analysis            |          203.72 |                 224.72 |    18.79 |           20.59 |
| Stock                       |          215.27 |                 228.95 |    20.81 |           22.14 |
| Ticket                      |          223.20 |                 236.73 |    23.64 |           24.96 |
| Class ranking               |          184.46 |                 205.71 |    17.89 |           19.69 |
| Lecturer's student summary  |          205.91 |                 224.36 |    21.70 |           23.02 |
| Lecturer's student analysis |          205.07 |                 226.08 |    19.81 |           21.61 |
| Lecturer's student journal  |          197.21 |                 211.64 |    19.32 |           20.64 |

The sheet reuses the allocation engine, rule calculations, and label placement. A direct import of the existing label styles replaces CSS composition that loaded their stylesheet twice. The final table includes the resulting stylesheet graph.

The phone probe compares main at `a63a054` with an earlier build of this change. It uses Chromium at 360 by 740 pixels with touch, fourfold CPU slowdown, a disabled cache, 150 ms latency, 200,000 bytes per second downstream, and 93,750 upstream. It takes three cold visits per route on each build, with copies of one sample database and the same synthetic student. The following values are medians in seconds. Lesson readiness waits for the heading on main and a slider in the new exercises. Ticket readiness waits for its hydrated form. Other routes wait for their heading.

| Route            | Main first contentful paint | Exercise first contentful paint | Main ready | Exercise ready |
| ---------------- | --------------------------: | ------------------------------: | ---------: | -------------: |
| Lesson 2         |                       1.864 |                           2.420 |      2.019 |          6.412 |
| Lesson 6         |                       1.920 |                           2.212 |      2.114 |          5.703 |
| Market           |                       3.652 |                           2.712 |      4.627 |          3.786 |
| Student analysis |                       3.104 |                           2.728 |      7.384 |          6.945 |
| Ticket           |                       3.456 |                           3.736 |     14.015 |         14.506 |
| Class home       |                       2.788 |                           3.072 |      3.089 |          3.214 |

The new lessons render their explanation, drawing, values, and tables before the sliders appear. The last revision of the exercises after the probe added 0.56 kB of JavaScript to each class route and removed 0.18 kB of CSS. These local samples do not establish a speedup or physical phone performance. Other workers used this machine during the probe, which limits a comparison of elapsed times. [Issue #257](https://github.com/radenadam/portolab/issues/257) tracks the broader controlled phone comparison.

## Alternatives

- Removing exercises from sheets would make them differ from the approved prototype and their full pages.
- A deferred import can postpone a request, but it still counts in the complete dependency set.
- Separate chart and trading calculations would duplicate rules that existing screens already apply. The exercises reuse those implementations and their tests.
- Raising every route ceiling would also admit growth on unrelated pages. The allowances name only the measured routes that need them.

## Consequences

The lessons and guide retain native content, contextual help, keyboard controls, and tasks with a return to practice. Both languages and device projects exercise them. The sample already supplies measured stock pairs and stored fills, and its tests now require that data for these lessons.

The limits remain in `scripts/client-route-limits.ts`. Graph tests cover each named exception, both asset kinds, unchanged default limits for learning routes, and similarly named routes without allowances.
