# 0042. Client CSS is budgeted by route

- Status: Accepted. [Decision 0046](0046-kelas-has-a-measured-css-allowance-for-reused-portfolio-styles.md) replaces its CSS ceiling for the class overview route. [Decision 0048](0048-complete-lesson-sheets-have-measured-route-allowances.md) replaces its CSS ceiling for class home, ticket, market, the lecturer's student portfolio, demonstration summary, and demonstration analysis.
- Date: 2026-11-15

## Context

The Analysis rebuild in [#199](https://github.com/radenadam/portolab/pull/199), at `358c859`, reaches 21.55 kB gzip of CSS after merging the class map and ranking rebuilds. The whole-client CSS ceiling of 20 kB stops its check, although Vite emits separate stylesheets for the routes and their shared chunks. The build's chunk manifest records these stylesheets in each chunk's `css` field.

[Decision 0038](0038-client-javascript-is-budgeted-by-route.md) budgets the complete JavaScript dependency set of each route, but kept the CSS ceiling over the sum of all routes. A new screen can therefore fail the CSS check because another screen has styles that it does not use. [Issue #205](https://github.com/radenadam/portolab/issues/205) records this failure.

The measurements below use the saved build of `358c859` and the compression method of decision 0038. The dependency sets include the bootstrap, root, ancestor routes, static imports, and deferred imports. They include each asset once. No runtime asset changes in this decision.

| Dependency set                     | CSS, kB gzip |
| ---------------------------------- | -----------: |
| Shared code                        |         6.47 |
| Analisis                           |        12.79 |
| Mahasiswa                          |        12.02 |
| Lecturer's student analysis        |        13.16 |
| Beranda, which has the largest set |        14.85 |
| All routes together                |        21.55 |

## Decision

- The CSS ceiling stays at 20 kB gzip, but applies to the complete stylesheet dependency set of each route. The root has its own shared CSS entry under the same ceiling. The largest measured set leaves 5.15 kB of room, so the phone guard does not need a higher per-page ceiling to admit Analysis.
- `scripts/client-size.ts` uses the same chunk walk for JavaScript and CSS. It follows a chunk's stylesheet paths and stylesheet chunks as well as its static and deferred imports. Ancestors and split route exports participate in both budgets. A malformed stylesheet list or a referenced file missing from the build fails with its source named.
- Stylesheets without an owner in the route graph count on every route, including files outside the chunk manifest and stylesheet assets listed without a route import. The asset scan includes every CSS file below the client build, so a stylesheet outside the assets folder cannot escape the check.
- The sum of all client CSS stays in the report without a ceiling. The JavaScript budgets remain governed by decision 0038.

## Alternatives

- **Keep the whole-client CSS ceiling.** It blocks the measured Analysis change even though every complete route set fits below that ceiling.
- **Raise the whole-client ceiling.** It would admit this change, but could also admit a page that loads more than 20 kB of CSS. A sum still would not say which route needs attention.
- **Remove styles from the rebuilt screen or from the remaining Tenang screens.** The rebuilt screens must follow Peta, and the screens awaiting their rebuild still need their existing styles. Their independent styles are not part of one page's dependency set.

## Consequences

The build, styles, and loading behavior stay the same. The check now bounds the stylesheet set of a page instead of the size of unrelated pages together. A route that exceeds its ceiling needs its own dependency set inspected. Hiding an import behind an interaction does not remove its bytes from that set.

New routes need no budget entry by hand. The parser and graph tests cover inherited, shared, deferred, aliased, standalone, and unlisted stylesheets, and a missing stylesheet fails before Size Limit runs.
