# 0037. Client JavaScript is budgeted by route

- Status: Accepted
- Date: 2026-11-14

## Context

Issue #150 measured 193.51 kB of client JavaScript after the map of #147. About 20 screens of #127 remain. At the start of this change, main at `9a05fda` measures 199.78 kB against the 200 kB limit that the scaffold set. Decision 0029 put every JavaScript file under that one limit after removing the chart library.

[React Router splits code by route](https://reactrouter.com/explanation/code-splitting). A student opening the market does not load the order list, the map of the measures, or the time chart of the portfolio. A sum of all routes therefore stops separate screens from growing even when none makes another screen slower. Raising that sum would still tell us little about what a student downloads.

The measurements below use main at `c42dcdf`, which added the concept cards and set the whole-client ceiling to 202 kB. They use `pnpm build` and the installed `@size-limit/file` plugin through `pnpm size`. The plugin compresses each file with gzip at level 9 and adds its size. kB means 1,000 bytes. The totals include both languages. A diagnostic build with `pnpm exec react-router build --sourcemapClient hidden` identifies the modules in each chunk without adding source map comments to the JavaScript.

### What the client holds

These chunks are measured separately with Size Limit's `--config` option and a report entry for each path. A chunk can hold several concepts, so its size is not the size of one component alone.

| Chunks                   | kB gzip | What their source maps contain                                                          |
| ------------------------ | ------: | --------------------------------------------------------------------------------------- |
| `entry.client`           |   68.89 | React DOM, scheduler, and the hydration code of React Router                            |
| `jsx-runtime`            |   40.00 | React and the core of React Router                                                      |
| `lib`                    |    3.95 | The DOM forms and links of React Router                                                 |
| `app_name`               |    1.42 | Paraglide runtime and the app name message                                              |
| `manifest`               |    2.88 | The browser route manifest that React Router writes outside Vite's graph                |
| `portfolio-concept-rows` |    8.74 | The risk map, its label placement, its section, the measures tables, and their messages |
| `portfolio-view`         |    5.08 | The time chart, the portfolio view, and their messages                                  |

The first three chunks total 112.84 kB. The shared set totals 131.08 kB, including the browser manifest, the frame, its menus, formatting, and their messages. Paraglide messages also appear in the chunks of the features that use them, rather than in one catalogue loaded by every page. The two chart chunks are outside the shared set. No chart library is present, as decision 0029 requires.

### What each route carries

Each row includes the bootstrap, root, all ancestor routes, and their transitive imports. Deferred imports count too, even when a reader has not opened their control yet. The browser manifest counts on every route. Download and action routes are included conservatively, even though they do not hydrate a screen.

| Route module                     | kB gzip before | kB gzip after |
| -------------------------------- | -------------: | ------------: |
| Shared code                      |         131.08 |        131.08 |
| `home/home-page`                 |         131.54 |        131.54 |
| `market-data/prices-page`        |         137.01 |        137.01 |
| `accounts/sign-in-page`          |         131.93 |        131.93 |
| `accounts/sign-out-page`         |         131.43 |        131.43 |
| `accounts/account-page`          |         136.44 |        136.44 |
| `accounts/account-setup-page`    |         136.09 |        136.09 |
| `accounts/privacy-page`          |         134.18 |        134.18 |
| `classes/classes-page`           |         133.62 |        133.62 |
| `classes/class-page`             |         135.01 |        135.01 |
| `classes/calendar-page`          |         132.64 |        132.64 |
| `market-data/market-page`        |         137.01 |        137.01 |
| `trading/orders-page`            |         148.23 |        148.23 |
| `trading/portfolio-page`         |         163.61 |        163.61 |
| `measures/measures-page`         |         157.38 |        157.38 |
| `measures/stock-measures-page`   |         141.98 |        141.98 |
| `grading/class-portfolios-page`  |         135.86 |        135.86 |
| `grading/workbook-route`         |         131.24 |        131.24 |
| `grading/student-portfolio-page` |         151.33 |        151.33 |
| `grading/student-measures-page`  |         157.22 |        157.22 |
| `classes/reset-password-page`    |         132.20 |        132.20 |
| `classes/join-page`              |         132.35 |        132.35 |
| `classes/join-class-page`        |         137.52 |        137.52 |
| `language/language-page`         |         131.49 |        131.49 |
| `health/health-route`            |         131.10 |        131.10 |
| `not-found-page`                 |         131.28 |        131.28 |
| All client JavaScript            |         201.92 |        201.92 |
| All client CSS                   |          11.85 |         11.85 |

This change alters the guard, and the runtime assets stay the same. The largest route leaves 36.4 kB under the route ceiling. Main's whole-client check leaves only 85 bytes for all remaining screens together.

## Decision

- The scaffold's 200 kB gzip ceiling applies to the complete JavaScript dependency set of each route. A separate 140 kB gzip ceiling guards the bootstrap and root dependencies shared by every page. The shared ceiling leaves 8.92 kB above the measured frame, which is already built, so a new screen has reason to keep its code out of that frame. The limits live in `scripts/client-size.ts`.
- `size-limit.config.ts` replaces `.size-limit.json`. It reads the Vite chunk manifest and the route manifest saved by the build. It discovers every route, including nested routes and split client exports. It follows static and deferred imports, counts each file once in each budget, and rejects missing entries, parents, imports, files, and parent cycles. JavaScript that Vite does not list counts on every route, so the browser manifest cannot escape the guard.
- The whole-client JavaScript total stays in the report without a limit. The CSS check keeps its existing scope and limit.
- An enhancement of a chart, sheet, or ticket belongs with the route that uses it. Shared components may live in `app/charts/` as decision 0029 sets, but a root or frame import must not load them on every page. Ordinary route imports already give this separation. A deferred import is useful when the reader needs it only after an interaction, and its bytes still count against that route.
- A limit changes only after measurements and a decision record explain why the phone experience remains acceptable. A byte budget guards growth, but it does not measure execution time or promise a loading time on a particular phone.

## Alternatives

- **Keep the limit on the whole client.** It rejects the next independent screens even though their code is split away from existing routes.
- **Raise the whole-client limit.** A total large enough for every screen could allow one route to grow by the same amount, which weakens the protection for a student on a phone.
- **Budget only a route's own chunk.** It misses the framework, the frame, ancestor layouts, shared imports, and deferred code, which can be most of a route's cost.
- **Split languages or replace the framework now.** The runtime and app-name chunk is small, and the feature messages already split with their callers. The current routes fit the route ceiling, so the measurements do not justify that migration.

## Consequences

Run `pnpm build` before `pnpm size`, or run `pnpm check` as usual. Pasar, Kelas, Beranda, Saham, the ticket, and Analisis need no handwritten budget entry. Their route and ancestor imports set their budget automatically. When a route fails, inspect its imports and enhancements. When shared code fails, inspect the bootstrap and root imports. Moving code behind a deferred import alone cannot make the budget pass.

The check needs both build manifests, so an absent or incomplete build fails with its source named. The build metadata stays outside the client assets that the server serves. No dependency, interface message, screen layout, or chart behavior changes.
