# 0060. Analysis panels have measured route allowances

- Status: Accepted
- Date: 2026-11-17

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
`a63a054`. kB means 1,000 bytes. Both languages count in each JavaScript set.

| Dependency set              | Main, JavaScript/CSS kB | Completed panels, JavaScript/CSS kB |
| --------------------------- | ----------------------: | ----------------------------------: |
| Shared                      |           141.86 / 7.76 |                       141.98 / 7.83 |
| Analysis                    |          203.63 / 18.79 |                      209.43 / 19.67 |
| Demonstration analysis      |          204.50 / 19.43 |                      210.30 / 20.31 |
| Lecturer's student analysis |          204.98 / 19.81 |                      210.78 / 20.70 |
| Stock                       |          215.17 / 20.81 |                      215.35 / 20.89 |
| Ticket                      |          223.09 / 23.64 |                      223.28 / 23.71 |

The panels add about 5.8 kB of JavaScript and 0.9 kB of CSS to each analysis
route. Their imports stay with analysis. The shared set includes the generated
route manifest, so changing chunks also changes bytes on routes whose source
does not change. The stock and ticket dependency sets grow by about 0.2 kB.
The new color and size tokens add a small amount of shared CSS.

The calculations reuse the existing data popover instead of repeating monthly
return tables for every pair and holding. The allocation selector is a link,
and cells and risk rows use native popovers. The server draws the bars and
heatmap cells as SVG, so these panels work before hydration. Browser checks
cover touch, keyboard controls, hydration, both languages, both themes, and the
phone and desktop layouts.

## Decision

- Student analysis has a JavaScript ceiling of 210 kB gzip.
- Demonstration analysis has a JavaScript ceiling of 211 kB gzip.
- The lecturer's student analysis has a CSS ceiling of 21 kB gzip.
- Demonstration analysis has a CSS ceiling of 20.5 kB gzip.
- Other ceilings and the complete dependency walk keep their rules.

The analysis JavaScript increase is less than 3% of its measured baseline.
The shared set, stock page, and ticket keep the allowances of
[decision 0057](0057-theme-choice-has-measured-shared-and-route-allowances.md).

## Alternatives

- **Keep the earlier ceilings.** The complete required panels exceed them.
  Removing a panel or its calculations would leave Peta incomplete.
- **Defer the panels behind an interaction.** The complete dependency walk
  still counts deferred code, and the reference shows these panels on opening
  analysis.
- **Raise every route ceiling.** Only the measured sets need an allowance,
  so other routes keep their guards.

## Consequences

`scripts/client-route-limits.ts` holds these allowances. Its existing graph
tests check the named routes and asset kinds, and keep the defaults on other
routes. No asset is omitted from the measurement.
