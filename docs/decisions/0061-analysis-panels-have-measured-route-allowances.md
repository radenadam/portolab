# 0061. Analysis panels have measured route allowances

- Status: Accepted. [Decision 0063](0063-a-personal-watchlist-has-measured-route-allowances.md) replaces its shared JavaScript ceiling and its JavaScript and CSS ceilings for Stock and Ticket. [Decision 0065](0065-the-welcome-has-measured-shared-and-route-allowances.md) replaces its CSS ceiling for shared code and its JavaScript and CSS ceilings for class home, student analysis, demonstration analysis, and the lecturer's student analysis.
- Date: 2026-11-18

## Context

Piece 24 completes the allocation, correlation, and risk contribution panels of
[Peta](0028-every-screen-follows-the-reference-screens-of-peta.md). The student,
the lecturer reading a student, and the demonstration portfolio use the same
panels. The existing estimates of decision 0031 supply the numbers. The change
adds their drawings, native calculation controls, and messages in both languages.

These measurements use `pnpm build` and `pnpm size`, with the complete dependency
walk and gzip method of decisions
[0038](0038-client-javascript-is-budgeted-by-route.md) and
[0042](0042-client-css-is-budgeted-by-route.md). The baseline is main at
`0bb55f0`, which includes the ceilings of
[decision 0060](0060-learning-practices-have-measured-sheet-allowances.md). The
combined build merges that main into this change, on the same machine. kB means
1,000 bytes. Both languages count in each JavaScript set.

| Dependency set              | Main, JavaScript/CSS kB | Combined, JavaScript/CSS kB |
| --------------------------- | ----------------------: | --------------------------: |
| Shared code                 |           142.50 / 7.83 |               142.65 / 7.90 |
| Student analysis            |          225.02 / 21.09 |              229.23 / 21.97 |
| Demonstration analysis      |          225.89 / 21.72 |              230.10 / 22.60 |
| Lecturer's student analysis |          226.37 / 22.11 |              230.58 / 22.99 |
| Class home                  |          234.94 / 25.41 |              235.22 / 25.48 |
| Stock                       |          229.25 / 22.63 |              229.59 / 22.70 |
| Ticket                      |          237.02 / 25.46 |              237.36 / 25.53 |

The panels add about 4.2 kB of JavaScript and 0.9 kB of CSS to each analysis
route. Their imports stay with analysis. The shared set includes the generated
route manifest, which names the new chunks of the analysis routes, so it grows
by 0.15 kB, and every route grows with it. The panels also import helpers that
other routes use, such as `parseChoice`, so the build groups those helpers into
chunks differently. Class home, the stock page, and the ticket therefore grow by
0.28 to 0.34 kB without a change to their source, which puts them over their
ceilings. The new color and size tokens add 0.07 kB of shared CSS.

The calculations reuse the existing data popover instead of repeating monthly
return tables for every pair and holding. The allocation selector is a link,
and cells and risk rows use native popovers. The server draws the bars and
heatmap cells as SVG, so these panels work before hydration. Browser checks
cover touch, keyboard controls, hydration, both languages, both themes, and the
phone and desktop layouts.

## Decision

These ceilings replace those of decision 0060 for the named dependency sets.
They leave a margin of about 0.15 to 0.3 kB, as decision 0060 does, because the
shared manifest and the stylesheet splits also change compressed totals.

| Dependency set              | JavaScript ceiling, kB gzip | CSS ceiling, kB gzip |
| --------------------------- | --------------------------: | -------------------: |
| Shared code                 |                       142.8 |                   20 |
| Student analysis            |                       229.5 |                 22.2 |
| Demonstration analysis      |                       230.4 |                 22.9 |
| Lecturer's student analysis |                       230.9 |                 23.3 |
| Class home                  |                       235.5 |                 25.7 |
| Stock                       |                       229.8 |                 22.9 |
| Ticket                      |                       237.6 |                 25.8 |

Every other ceiling and the complete dependency walk keep their rules. The
analysis JavaScript grows by less than 2% of its measured baseline, and every
other set grows by less than 0.15%.

## Alternatives

- **Keep the earlier ceilings.** The complete required panels exceed them.
  Removing a panel or its calculations would leave Peta incomplete.
- **Defer the panels behind an interaction.** The complete dependency walk
  still counts deferred code, and the reference shows these panels on opening
  analysis.
- **Group the chunks of the build by hand.** A rule for the chunks could keep
  the shared helpers where class home, the stock page, and the ticket had them.
  Every later change would then have to keep that rule true, which costs more
  than about 0.2 kB on three routes.
- **Raise every route ceiling.** Only the measured sets need an allowance,
  so other routes keep their guards.

## Consequences

`scripts/client-route-limits.ts` holds these allowances. Its existing graph
tests check the named routes and asset kinds, and keep the defaults on other
routes. No asset is omitted from the measurement.
