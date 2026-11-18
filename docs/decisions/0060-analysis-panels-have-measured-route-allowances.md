# 0060. Analysis panels have measured route allowances

- Status: Accepted
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
`5a209f4`, which includes decisions
[0058](0058-home-outcomes-have-a-measured-route-allowance.md) and
[0059](0059-the-owner-supplies-company-logos-outside-the-repository.md). The
combined build merges that main into this change. kB means 1,000 bytes. Both
languages count in each JavaScript set.

| Dependency set              | Main, JavaScript/CSS kB | Combined, JavaScript/CSS kB |
| --------------------------- | ----------------------: | --------------------------: |
| Shared                      |           141.94 / 7.79 |               142.05 / 7.86 |
| Analysis                    |          203.72 / 18.82 |              209.62 / 19.70 |
| Demonstration analysis      |          204.60 / 19.45 |              210.49 / 20.33 |
| Lecturer's student analysis |          205.07 / 19.84 |              210.97 / 20.72 |
| Beranda                     |          220.62 / 23.68 |              220.74 / 23.75 |
| Stock                       |          215.45 / 20.91 |              215.61 / 20.98 |
| Ticket                      |          223.38 / 23.74 |              223.54 / 23.81 |

The panels add about 5.9 kB of JavaScript and 0.9 kB of CSS to each analysis
route. Their imports stay with analysis. The shared set includes the generated
route manifest, which names the new chunks of the analysis routes, so it grows
by 0.11 kB. The panels also import helpers that other routes use, such as
`parseChoice`, so the build groups those helpers into chunks differently.
Beranda, the stock page, and the ticket therefore grow by 0.12 to 0.16 kB
without a change to their source. That puts Beranda 42 bytes, the stock page
11 bytes, and the ticket 36 bytes over their ceilings. The new color and size
tokens add 0.07 kB of shared CSS.

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
- Beranda has a JavaScript ceiling of 220.8 kB gzip.
- The stock page has a JavaScript ceiling of 215.7 kB gzip.
- The ticket has a JavaScript ceiling of 223.6 kB gzip.
- Other ceilings and the complete dependency walk keep their rules.

The analysis JavaScript increase is less than 3% of its measured baseline, and
Beranda, the stock page, and the ticket grow by less than 0.1%. The shared set
keeps the allowance of
[decision 0057](0057-theme-choice-has-measured-shared-and-route-allowances.md).

## Alternatives

- **Keep the earlier ceilings.** The complete required panels exceed them.
  Removing a panel or its calculations would leave Peta incomplete.
- **Defer the panels behind an interaction.** The complete dependency walk
  still counts deferred code, and the reference shows these panels on opening
  analysis.
- **Group the chunks of the build by hand.** A rule for the chunks could keep
  the shared helpers where Beranda, the stock page, and the ticket had them.
  Every later change would then have to keep that rule true, which costs more
  than about 0.15 kB on three routes.
- **Raise every route ceiling.** Only the measured sets need an allowance,
  so other routes keep their guards.

## Consequences

`scripts/client-route-limits.ts` holds these allowances. Its existing graph
tests check the named routes and asset kinds, and keep the defaults on other
routes. No asset is omitted from the measurement.
