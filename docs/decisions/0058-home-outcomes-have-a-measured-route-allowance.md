# 0058. Home outcomes have a measured route allowance

- Status: Accepted. [Decision 0060](0060-analysis-panels-have-measured-route-allowances.md) replaces its JavaScript ceiling for Beranda.
- Date: 2026-11-17

## Context

Piece 27 of #127 lists the order outcomes since a student last closed the summary on Beranda. It reuses the activity outcome, status chip, rejection help, and next-order step. Both languages explain invalid dismissal metadata and offer a reload. No dependency is added.

The baseline is the [passing fast check](https://github.com/radenadam/portolab/actions/runs/44115139076/job/134151186144) of `12d7589`. Its source tree is identical to main at `a63a054`, which includes the market map, quoted day range, and theme choice. The combined local build includes that main and this change. Both use the complete dependency walk and gzip method of [decision 0038](0038-client-javascript-is-budgeted-by-route.md) and [decision 0042](0042-client-css-is-budgeted-by-route.md). kB means 1,000 bytes.

| Dependency set | Main JavaScript/CSS kB | Combined JavaScript/CSS kB |
| -------------- | ---------------------: | -------------------------: |
| Shared         |          141.86 / 7.76 |              141.94 / 7.76 |
| Beranda        |         211.02 / 22.95 |             220.44 / 23.58 |

Beranda adds about 9.42 kB of JavaScript and 0.63 kB of CSS. Its JavaScript exceeds the earlier ceiling by 442 bytes. Shared JavaScript and every other route and stylesheet set pass their existing ceilings.

## Decision

Beranda at `features/classes/class-page` has a JavaScript ceiling of 220.7 kB gzip. Every other ceiling and the complete dependency walk keep their rules.

## Alternatives

- Keep the earlier ceiling. The combined required dependency set fails it.
- Show only a status label. This would remove the outcome's numbers, rule, and recovery step that the interface standard requires.
- Put the card in a deferred import. The complete route budget includes deferred imports, so the ceiling would still apply.
- Raise the shared allowance or every route allowance. Those sets already pass.

## Consequences

`scripts/client-route-limits.ts` keeps this allowance on Beranda alone. Its tests check the exact route and retain the default limits for a similarly named route. The card remains a server-rendered form and works before JavaScript loads.
