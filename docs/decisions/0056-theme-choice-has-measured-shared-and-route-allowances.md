# 0056. Theme choice has measured shared and route allowances

- Status: Accepted
- Date: 2026-11-17

## Context

Piece 34 of #127 adds the approved theme choice to both profile menus.
The server entry reads its cookie and renders the choice before the browser
loads JavaScript, including failures before the root loader runs. The theme form and its messages belong to the shared frame,
because the frame offers the profile across the app. A deferred import still counts
under the complete dependency walk of decision 0038.

These measurements use main at `21dce2a`, followed by this change, with
`pnpm build` and `pnpm size`. They use the gzip method and dependency sets
of [decision 0038](0038-client-javascript-is-budgeted-by-route.md) and
[decision 0042](0042-client-css-is-budgeted-by-route.md). kB means 1,000 bytes.

| Dependency set         | Main JavaScript/CSS kB | Theme choice JavaScript/CSS kB |
| ---------------------- | ---------------------: | -----------------------------: |
| Shared                 |          140.16 / 7.50 |                  141.81 / 7.76 |
| Pasar                  |         194.56 / 19.93 |                 196.23 / 20.18 |
| Saham                  |         213.36 / 20.39 |                 215.04 / 20.71 |
| Ticket                 |         221.28 / 23.16 |                 222.96 / 23.54 |
| Analisis               |         201.65 / 18.53 |                 203.31 / 18.79 |
| Demonstration analysis |         202.52 / 19.11 |                 204.18 / 19.43 |

The theme and language choices reuse the segmented-choice stylesheet.
The palette keeps one definition for each pair of colors through
[CSS light-dark()](https://www.w3.org/TR/css-color-5/#light-dark), which
selects from the used color scheme. This avoids two copies of every dark
color for the device setting and the explicit choice. Shadows retain their
original dimensions in both themes. No new dependency or startup script is
needed. The native form works before JavaScript loads.

The server and browser entries provide one initial theme for a document.
The server reads the cookie even when middleware refused the request before
its loaders. The browser validates the server's data-theme attribute before
hydration. The form reloads the document when it changes the choice, so the
frame and the theme page need no separate loader state. The enum parser
shares its check with the form, whose failure builder supplies the localized
rule and next step without loading those errors into the startup bundle.

## Decision

- The document entries compose the theme provider. The feature import check
  permits those two entry files alongside the existing composition modules.

- Shared JavaScript has a ceiling of 142.1 kB gzip.
- Saham JavaScript has a ceiling of 215.3 kB gzip.
- Ticket JavaScript has a ceiling of 223.2 kB gzip.
- Analisis JavaScript has a ceiling of 203.6 kB gzip.
- Demonstration analysis JavaScript has a ceiling of 204.4 kB gzip.
- Pasar CSS has a ceiling of 20.3 kB gzip.
- Every other ceiling and the complete dependency walk keep their rules.

The shared JavaScript allowance grows by 1.4%, and each route JavaScript
allowance grows by less than 1%. Pasar adds
0.25 kB of CSS, and its allowance grows by 1.5%. The shared control is part
of the approved design and works wherever the frame offers a profile.
Its form, colors, and first paint work without JavaScript, so the control
is usable before the additional JavaScript arrives. Browser tests compare every root
token with the corresponding system theme, and axe checks each explicit choice on the opposite device setting.
These facts support the bounded allowances. They promise no loading time
on a physical phone.

## Alternatives

- **Read the theme only in the root loader.** A rejected origin or an oversized
  form can stop before that loader. A local probe with a valid dark cookie
  rendered system mode on a 403 page, so that boundary cannot own the initial
  theme of every document.

- **Keep the previous ceilings.** The required shared control crosses five
  JavaScript ceilings, and the shared palette crosses the Pasar CSS ceiling.
- **Load theme controls only on the account page.** The approved profile
  menu offers the choice where the reader is working.
- **Copy the language switch styles or duplicate the dark palette.** Those
  copies would grow the styles and let the controls or colors drift.
- **Raise every route ceiling.** Only the measured dependency sets need
  an allowance.

## Consequences

`scripts/client-route-limits.ts` keeps the allowances on their named
sets. Its tests keep the limits of other routes and asset kinds unchanged.
The theme choice needs no database record or sample-class data, so the
existing sample accounts can use it immediately.
