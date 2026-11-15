# 0047. Trade impact has measured allowances for its combined screens

- Status: Accepted
- Date: 2026-11-16

## Context

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
75 bytes. The ticket remains within the measured allowance above.

The shared set includes the route manifest, which lists imports for every
route. The combined manifest is 4,916 bytes gzip. The text formatter's
explicitly grouped placeholders reuse its existing marker callback instead of
adding a second callback and tagged objects. The same build's formatter and
language runtime share a 2,386-byte chunk. The first combined implementation
measured 140.13 kB for shared JavaScript. The smaller representation saved
58 bytes before the closed-page layout correction. The reductions above remain in place. Removing approved stock
controls, recovery steps, or lesson sheets would make the combined screen
incomplete.

## Decision

- `features/trading/ticket-page` has ceilings of 210 kB gzip JavaScript and
  21 kB gzip CSS. `features/market-data/stock-page` has a JavaScript ceiling
  of 202 kB gzip and keeps its 20 kB CSS ceiling. Shared JavaScript has a
  ceiling of 141 kB gzip, and shared CSS keeps its 20 kB ceiling. These
  leave 0.80/0.70 kB for the ticket, 0.59 kB for stock JavaScript, and
  0.93 kB for shared JavaScript in the final combined build.
- Other routes keep their existing ceilings, including the separate Kelas
  CSS allowance of [decision 0046](0046-kelas-has-a-measured-css-allowance-for-reused-portfolio-styles.md).
- The check still includes bootstrap, root, ancestors, static and deferred
  imports, and unowned assets. Regression tests keep each allowance on its
  named set and retain the default limits for other routes.

The ticket increase is 5% of each earlier ceiling. The stock JavaScript
increase is 1%, and the shared JavaScript increase is less than 1%. The ticket renders its comparison,
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
  and hydration chunks alone account for 108.08 kB in the final combined build. The measured increase
  does not justify that scope in this piece.

## Consequences

The ticket remains the one route that loads the stock and a complete order form
at once. The stock, ticket, and shared JavaScript set have their measured
allowances. Every other set retains its ceiling. No asset is removed from the
dependency walk, and the ceiling changes add no runtime code.
