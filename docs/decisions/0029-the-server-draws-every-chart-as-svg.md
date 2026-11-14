# 0029. The server draws every chart as SVG

- Status: Accepted. [Decision 0035](0035-the-map-names-its-points-in-words-and-keeps-the-name-of-the-reader.md) changes one of its rules: the font of the names of the points of a map, whose widths the server estimates and the browser measures, while DM Mono keeps the marks of the axes. [Decision 0037](0037-client-javascript-is-budgeted-by-route.md) replaces its rule about the scope of the client JavaScript budget.
- Date: 2026-11-14

## Context

[Decision 0008](0008-lightweight-charts-and-svg-draw-the-charts.md) draws a chart with time on its horizontal axis with Lightweight Charts, which draws on a canvas in the browser, and every other chart as SVG. [Decision 0019](0019-a-table-of-points-makes-a-time-chart-accessible.md) loads the library only with a chart, as a file of 61 kB after gzip with a budget of its own, hides the canvas from assistive technology behind a table of its points, links to TradingView below each chart as the license of the library asks, and lets a drag on the chart scroll the page. The only such chart is the return of a portfolio against the IHSG.

The design of [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) puts charts on most screens: the return against the IHSG, the price of a stock with a crosshair and a tooltip, a sparkline in each row of the 45 stocks of the market and of the holdings, and the map of risk against return. A canvas shows nothing until its library has loaded, so a page on a slow phone network shows an empty frame, and a page before JavaScript loads shows no chart at all. A chart of the library takes its colors from options in code, so it follows the tokens of the theme only through code that reads them in the browser, and every page with a chart would carry the link to TradingView.

## Decision

- Every chart is an SVG component that the server renders as part of its page, in the colors and the fonts of the tokens of decision 0028, so it shows before JavaScript loads. The charts that several features share live in `app/charts/`.
- The server does not know the width of the screen, so a chart places its marks, its texts, and the ends of its lines at fractions of its plot, which the browser turns into pixels at whatever width the plot has. A line runs through a drawing that counts a hundred steps across and down, which the browser stretches over the plot while the stroke keeps its width. Every other length is a multiple of the size of the text of the chart, so the chart keeps its proportions when a reader enlarges the text. The texts of the marks use DM Mono, which decision 0028 sets for the labels of charts and whose characters are equally wide, so the server leaves them room in widths of a character.
- Every chart over time keeps the table of its points behind a label that opens it, as decision 0019 decides, and a legend names each of its lines with its latest value.
- Once JavaScript runs, the plot of a chart over time is a slider that its heading names. A pointer, a finger, or the arrow keys, Home, and End mark a date with a crosshair and a dot on each line, and a tooltip shows the date with the value of each line. The slider gives a screen reader the same text as its value, and Escape hides the crosshair. Before JavaScript runs, the plot is a drawing that screen readers skip, so no control waits for code that has not loaded.
- On a touch screen, a vertical drag on a chart scrolls the page, and a horizontal drag moves the crosshair.
- Portolab ships no chart library, so a chart has no notice of a license.

## Alternatives

- **Lightweight Charts in the colors of Peta.** A page would still show an empty frame until the library loads, and nothing before JavaScript loads. A sparkline in each row of a list of 45 stocks would need a chart of its own, and every page with a chart would carry the link to TradingView.
- **A chart that the server lays out for one width, which the browser scales into its frame until it measures the frame.** The chart of the security market line of [decision 0023](0023-the-chart-of-the-security-market-line-draws-the-months-of-the-portfolio.md) works so. Its text grows on a wide screen and shrinks on a phone until JavaScript measures the frame, and it keeps the wrong size when JavaScript does not run.
- **A chart library that renders SVG, such as Recharts or visx.** Recharts measures its frame in the browser before it draws, which shows nothing before JavaScript loads. visx gives the same parts that a few small functions here give, as a dependency, and every interaction would still be written here.

## Consequences

- Every chart is SVG in the tokens of the theme, as decision 0008 set for a chart without time on its horizontal axis.
- The chart of the security market line keeps the layout and the accessibility of decision 0023 until the map of risk against return replaces it, as issue #127 tracks. The map builds on the scales of `app/charts/scale.ts`.
- [`app/charts/AGENTS.md`](../../app/charts/AGENTS.md) holds the standards of the code of a chart.
