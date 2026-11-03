# 0019. A table of its points makes a chart over time accessible

- Status: Accepted
- Date: 2026-11-03

## Context

Decision 0008 draws a chart with time on its horizontal axis with Lightweight Charts 5 and its accessibility plugin. The first such chart is the return of a portfolio against the IHSG, which decision 0018 describes. The plugin, `@tradingview/lwc-plugin-accessibility` 1.0.0 of September 2026, lets a keyboard move from point to point and has a screen reader announce each point, a summary, the keys, and a table. It speaks English unless a page gives it every one of its sentences, about 30, many of which change with a count. Each of them would become a Paraglide message in both languages with a test that shows it in full, although a sighted reader never sees most of them. The plugin also adds about 31 kB to the 61 kB of the library, after gzip. `docs/product.md` asks besides that a student can check every number by hand, which a canvas does not allow.

## Decision

- The canvas of a chart with time on its horizontal axis and its legend are hidden from assistive technology. A table beside the chart lists every point with its date and its values, behind a label that opens it, which a keyboard and a screen reader reach. So the chart shows nothing that the table lacks.
- The page loads the library only when a chart appears, so the library is a file of its own with a budget of its own in `.size-limit.json`, and the other pages keep the budget of the scaffold.
- The license of the library asks for the attribution notice of its NOTICE file and a link to TradingView on each page that shows a chart. The page shows them as a link below the chart. The logo that the library can draw would be a link inside the hidden canvas, smaller than a touch target.
- A drag or a pinch on the chart scrolls the page instead of moving the chart, which shows every point at once.

## Alternatives

- **The plugin with every sentence translated.** A screen reader could move through the points in the chart itself, but about 30 messages in two languages, most of them hidden from sighted readers, and 31 kB more would serve what the table already gives.
- **The plugin in English.** A reader of the Indonesian interface would hear English, which the standard of complete languages rules out.
- **A summary of the chart as its accessible name.** Short, but a reader could not reach the value of any day.

## Consequences

- Every chart with time on its horizontal axis ships with a table of its points, which also serves a student who checks a number by hand.
- The budget of client JavaScript has two parts: the pages, and the chart library that loads with a chart.
