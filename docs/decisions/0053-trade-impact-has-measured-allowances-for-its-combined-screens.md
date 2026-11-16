# 0053. Trade impact has measured allowances for its combined screens

- Status: Accepted
- Date: 2026-11-17

## Context

The earlier build measurements below precede the completed lesson exercises.
The final merge section measures their combined stock and ticket routes.

The trade impact in piece 20 of #127 fits the route ceilings before the lesson
sheets of [#243](https://github.com/radenadam/portolab/pull/243) merge. The
combined ticket exceeds both ceilings. It includes its parent stock screen,
the order form, the live impact calculation, maps, concept cards, and the class
layout that opens lessons and terms in place. Removing those parts would leave
the approved screen incomplete.

These measurements use `pnpm build` and `pnpm size`, with the compression and
complete dependency walk of [decision 0038](0038-client-javascript-is-budgeted-by-route.md)
and [decision 0042](0042-client-css-is-budgeted-by-route.md). kB means 1,000 bytes.
The earlier build is `66cfe93`, whose [CI check](https://github.com/radenadam/portolab/actions/runs/43737457514)
passes. The combined build is `3f479e1`, which merges main at `d21ebd1`.

| Dependency set | Before lesson sheets, JavaScript/CSS kB | Combined, JavaScript/CSS kB |
| -------------- | --------------------------------------: | --------------------------: |
| Shared         |                           137.38 / 7.47 |               139.17 / 7.70 |
| Saham          |                          191.56 / 15.23 |              199.85 / 17.77 |
| Ticket         |                          199.87 / 17.66 |              207.60 / 20.20 |

Main at `d21ebd1` measures 187.78/17.44 kB for the ticket, as #243 records.
Trade impact adds 19.82/2.76 kB to that complete route. The combined ticket
adds 7.76 kB of JavaScript beyond Saham. Its two exclusive chunks contain the
order form and its messages, and measure 7,378 and 377 bytes. The JavaScript
excess is almost as large as those two chunks together.

The earlier dependency inspection removed the exchange calendar and unused
universe initialization from the client, bounded daily histories on the server,
and moved class distribution drawing to its caller. Those reductions remain.
Deferring another import would not reduce this complete-route measurement.

A local Chromium probe uses a 360 by 740 viewport, a cold cache, 150 ms network
latency, and 200,000 download bytes per second. Its recorded BBCA and TLKM
portfolio starts at 10 lots. Six changes between 10 and 11 lots measure 89 to
176 ms from the input event to the next animation frame after the expected beta
appears. First contentful paint is 3.40 seconds, and the hydrated form is ready
after 10.30 seconds. The server renders the comparison and native form before
that enhancement is ready.

The probe's server used the system Node runtime, while the production build
and checks used the project's pinned runtime. The linked controlled comparison
also records those versions.

The same probe with a fourfold CPU throttle measures 1,267 to 4,298 ms for six
input updates. The host reports 100% CPU load. These local observations cannot
establish physical phone latency. [Issue #257](https://github.com/radenadam/portolab/issues/257)
tracks a controlled comparison with the same portfolio, separate paint,
hydration, and input measurements, and a phone or an idle throttled host.

## The demonstration merge

The later merge of main `1a0ccf5` includes the demonstration portfolio of
[#253](https://github.com/radenadam/portolab/pull/253). Both roles now use the
same stock page and ticket. Their recovery steps select the correct portfolio
owner. Its [passing CI build](https://github.com/radenadam/portolab/actions/runs/43760746237)
has the same source tree as main `1a0ccf5`.

| Dependency set | Main, JavaScript/CSS kB | Combined, JavaScript/CSS kB |
| -------------- | ----------------------: | --------------------------: |
| Shared         |           139.91 / 7.80 |               140.07 / 7.80 |
| Saham          |          177.49 / 15.13 |              201.41 / 17.87 |
| Ticket         |          189.37 / 17.54 |              209.20 / 20.30 |

Trade impact adds 23.92/2.74 kB to Saham and 19.83/2.76 kB to the ticket.
The rounded shared JavaScript increase is 0.16 kB. The combined stock page exceeds its
JavaScript ceiling by 1.41 kB, and the shared set exceeds its ceiling by
75 bytes. The ticket remains within the allowance in [the decision](#decision).

The shared set includes the route manifest, which lists imports for every
route. The combined manifest is 4,916 bytes gzip. The text formatter's
explicitly grouped placeholders reuse its existing marker callback instead of
adding a second callback and tagged objects. The same build's formatter and
language runtime share a 2,386-byte chunk. The first combined implementation
measured 140.13 kB for shared JavaScript. The smaller representation saved
58 bytes before the closed-page layout correction. The reductions above remain in place. Removing approved stock
controls, recovery steps, or lesson sheets would make the combined screen
incomplete.

## The completed rebuild merge

Main at `32b33b2` includes the complete lesson exercises, sample class, and guide.
Its [passing fast check](https://github.com/radenadam/portolab/actions/runs/43923277180)
gives the baseline below. The combined build uses `pnpm build` and `pnpm size`
after merging that same main into piece 20. Both include the complete dependency
sets and use the compression method above.

| Dependency set         | Main, JavaScript/CSS kB | Combined, JavaScript/CSS kB |
| ---------------------- | ----------------------: | --------------------------: |
| Shared                 |           139.82 / 7.51 |               139.97 / 7.51 |
| Saham                  |          196.67 / 19.23 |              211.87 / 20.61 |
| Ticket                 |          208.47 / 21.66 |              219.47 / 23.05 |
| Demonstration analysis |          199.71 / 19.27 |              200.62 / 19.48 |

Trade impact adds 15.20/1.38 kB to Saham and 11.00/1.39 kB to the ticket.
Demonstration analysis shares the changed components and adds 0.91/0.21 kB.
The latest shared set fits its original ceiling. The ticket fits the allowance
of [decision 0049](0049-complete-lesson-sheets-have-measured-route-allowances.md),
which now governs that route. The stock page still needs its live comparison,
formulas, map, and complete lesson sheets. The common allocation engine of
the lesson exercises now computes the portfolio measures too, and all three
callers share one matrix lookup. Those reductions remain in the combined build.

## Decision

- `features/market-data/stock-page` has ceilings of 212 kB gzip JavaScript and
  21 kB gzip CSS. These leave 0.13/0.39 kB in the final combined stock build.
- `features/measures/demonstration-analysis-page` has a JavaScript ceiling of
  201 kB gzip and keeps its CSS ceiling. This leaves 0.38 kB for JavaScript.
- The ticket and other routes keep main's existing ceilings, including the
  complete exercise allowances of [decision 0049](0049-complete-lesson-sheets-have-measured-route-allowances.md).
  Both shared sets keep their original ceilings of decisions 0038 and 0042.
- The check still includes bootstrap, root, ancestors, static and deferred
  imports, and unowned assets. Regression tests keep each allowance on its
  named set and retain the default limits for other routes.

The stock JavaScript increase is 6%, its CSS increase is 5%, and the
demonstration analysis JavaScript increase is 0.5%. The stock page
remains smaller than the complete ticket under its accepted allowance. The ticket renders its comparison,
map, fields, and submit action on the server, so the native flow remains usable
before hydration. The phone browser checks cover typed lots, both map axes,
help, lesson sheets, and submission in both languages. They also cover the
native flow without JavaScript. Those checks and the measurements support this
bounded increase for the required combined screen. They do not set a loading
time promise for a physical phone.

## Alternatives

- **Keep the earlier ceilings.** The combined required dependency sets fail.
  Removing the impact, its explanations, or the lesson sheets would undo an
  accepted part of Peta.
- **Raise every route ceiling.** Only the named sets exceed their earlier ceilings, so other routes need no allowance.
- **Move code behind an interaction.** The complete dependency walk still
  counts those bytes, and the ticket needs its fields immediately.
- **Replace the framework or redesign the calculation boundary.** Either would
  expand this screen change into a separate architecture change. The framework
  and hydration chunks alone account for 108.08 kB in the demonstration build. The measured increase
  does not justify that scope in this piece.

## Consequences

The ticket remains the one route that loads the stock and a complete order form
at once. The stock and demonstration analysis have their measured allowances,
while the ticket follows decision 0049. Every other set retains its ceiling. No asset is removed from the
dependency walk, and the ceiling changes add no runtime code.
