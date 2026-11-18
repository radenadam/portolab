# 0057. Theme choice has measured shared and route allowances

- Status: Accepted. [Decision 0059](0059-the-owner-supplies-company-logos-outside-the-repository.md) replaces its Pasar JavaScript ceiling. [Decision 0060](0060-analysis-panels-have-measured-route-allowances.md) replaces its JavaScript ceilings for Saham, the ticket, student analysis, and demonstration analysis. It also replaces its rule that the lecturer's student analysis and demonstration analysis keep their earlier CSS ceilings.
- Date: 2026-11-17

## Context

Piece 34 of #127 adds the approved theme choice to both profile menus.
The server reads its cookie while rendering the document, including requests
that middleware refused before the root loader ran. The browser validates the
server's data-theme attribute before hydration. The form reloads the document
when it changes the choice, so the frame and theme page share one preference.

The theme and language choices reuse the segmented-choice stylesheet.
The palette keeps one definition for each pair of colors through
[CSS light-dark()](https://www.w3.org/TR/css-color-5/#light-dark), which selects
from the used color scheme. Shadows retain their dimensions in each theme.
The enum parser shares its check with the form. A failure builder supplies
the form's localized rule and next step without loading those errors into
the startup bundle. No dependency is added.

The baseline below is the [passing fast check](https://github.com/radenadam/portolab/actions/runs/44073798047/job/134006462622)
of `d09d27e`. Its source tree is identical to main at `81ab185`, which merged
the market map. The initial combined build is measured locally after merging that
main into the theme choice. Both use the complete dependency walk and gzip
method of [decision 0038](0038-client-javascript-is-budgeted-by-route.md) and
[decision 0042](0042-client-css-is-budgeted-by-route.md). kB means 1,000 bytes.

| Dependency set         | Main JavaScript/CSS kB | Initial JavaScript/CSS kB |
| ---------------------- | ---------------------: | ------------------------: |
| Shared                 |          140.21 / 7.50 |             141.85 / 7.76 |
| Pasar                  |         198.37 / 20.32 |            200.03 / 20.63 |
| Saham                  |         213.67 / 20.39 |            215.35 / 20.71 |
| Ticket                 |         221.60 / 23.16 |            223.28 / 23.54 |
| Analisis               |         201.97 / 18.53 |            203.62 / 18.79 |
| Demonstration analysis |         202.84 / 19.11 |            204.49 / 19.43 |

The initial Pasar JavaScript exceeds its earlier ceiling by 31 bytes.
Its CSS exceeds the allowance of decision 0056 by 126 bytes. The complete
route sets count each emitted stylesheet once, so the compression boundaries
of the combined map and shared controls participate in those totals.

The final build uses the shared field-failure component and includes main at
`2cabb13`, which adds the quoted trading day's range. Its measurements below
pass every ceiling chosen in this record.

| Dependency set         | Final JavaScript/CSS kB |
| ---------------------- | ----------------------: |
| Shared                 |           141.86 / 7.76 |
| Pasar                  |          200.04 / 20.63 |
| Saham                  |          215.17 / 20.81 |
| Ticket                 |          223.09 / 23.64 |
| Analisis               |          203.63 / 18.79 |
| Demonstration analysis |          204.50 / 19.43 |

## Decision

- The document entries compose the theme provider. The feature import check
  permits those two entry files alongside the existing composition modules.
- Shared JavaScript has a ceiling of 142.1 kB gzip.
- Pasar JavaScript has a ceiling of 200.3 kB gzip.
- Saham JavaScript has a ceiling of 215.6 kB gzip.
- Ticket JavaScript has a ceiling of 223.5 kB gzip.
- Analisis JavaScript has a ceiling of 203.9 kB gzip.
- Demonstration analysis JavaScript has a ceiling of 204.8 kB gzip.
- Pasar CSS has a ceiling of 20.8 kB gzip.
- Every other ceiling and the complete dependency walk keep their rules.

The shared JavaScript allowance grows by 1.3%, and each route JavaScript
allowance grows by less than 1%. Pasar adds 0.31 kB of CSS, and its allowance
grows by 1.5%. The control works wherever the frame offers a profile. Its
form, colors, and first paint work without JavaScript, so the control is
usable before the additional JavaScript arrives. Browser tests compare every
root token with its corresponding system theme. They keep the chosen theme
before and after hydration on origin and size refusals, and axe checks each
explicit choice on the opposite device setting. These checks and measurements
support the bounded allowances. They promise no loading time on a physical phone.

## Alternatives

- **Read the theme only in the root loader.** A rejected origin or oversized
  form can stop before that loader. A local probe with a valid dark cookie
  rendered system mode on a 403 page, so that boundary cannot own the initial
  theme of every document.
- **Keep the earlier ceilings.** The combined required dependency sets fail
  the shared, five route JavaScript, and Pasar CSS checks.
- **Load theme controls only on the account page.** The approved profile menu
  offers the choice where the reader is working.
- **Copy the language switch styles or duplicate the dark palette.** Those
  copies would grow the styles and let the controls or colors drift.
- **Raise every route ceiling.** Only the measured dependency sets need an
  allowance.

## Consequences

`scripts/client-route-limits.ts` keeps the allowances on their named sets.
Its tests retain the limits of other routes and asset kinds. The theme choice
needs no database record or sample-class data, so the existing sample
accounts can use it immediately.
