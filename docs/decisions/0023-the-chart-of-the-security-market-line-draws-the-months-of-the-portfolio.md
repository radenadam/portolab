# 0023. The chart of the security market line draws the line of the months of the portfolio

- Status: Accepted
- Date: 2026-11-11

## Context

The course session on CAPM draws the security market line, with the expected return against beta, and places each stock and portfolio against it, as issue #85 asks. Decision 0008 draws such a chart in SVG.

Decision 0013 measures a stock, or a portfolio with all its holdings, over the months in which the IHSG and every stock involved have a return. So the line itself depends on the months, because the risk-free rate is the BI-Rate at the end of the last of them, and the expected return of the IHSG is the mean of its returns in them. A stock that listed later, such as AMMN in July 2023, has fewer months than a stock with five years of returns, and a portfolio that holds it uses those fewer months too. The return that CAPM requires of such a stock, and its distance from the line, which its page shows, come from the line of its own months.

A point lies at its own distance from a drawn line only when the line is the one that its measures use. A chart that placed every stock against one line would show distances that differ from the numbers on the pages of some stocks, and it could place a stock above the line while its page says that it lies below.

Decision 0019 makes a chart over time accessible with a table of its points. An SVG chart could instead give each point a stop of the keyboard and a name that a screen reader reads.

## Decision

- The page of the measures of a student draws the line of the months of the portfolio when the portfolio has measures, with the portfolio and its stocks over those months, as the table of the stocks of the portfolio on the same page shows them. While the portfolio has no measures, the page draws the line of the latest complete months of the IHSG instead, with each stock of the portfolio whose own measures use those months, and it says that the portfolio has no measures yet.
- The chart also places every other stock whose measures use the same months, which give the same risk-free rate and the same expected return of the IHSG. The page names each stock whose measures use other months, whose own page shows its distance from the line of those months, and it says that the table of every stock explains why a stock has no measures.
- The page of the measures of a student that the lecturer of the class reads draws the portfolio and its stocks only, because that page has no table of every stock, and the lecturer cannot open the page of a stock. It draws no chart for a portfolio without measures, whose text already says why.
- The axes of the chart take the symbols β and E(R). The chart labels the risk-free rate at a beta of 0 with R and the subscript f, the IHSG at a beta of 1 with M, and the portfolio with p, in the notation of decision 0020, and each stock of the portfolio by its code. A stock that the portfolio does not hold has a mark without a label, because the labels of several dozen stocks do not fit on a phone.
- The chart is hidden from assistive technology, as decision 0019 decides for a chart over time. A table below it, behind a label that opens it, lists every point with its beta, its expected return, and its distance from the line, and the formula of the line stands between the chart and the table.
- The browser measures the frame of the chart, and the chart lays itself out at that size, so its text keeps the size of the small text of the page on a phone and on a computer.

## Alternatives

- **One line of the latest complete months for every point.** The portfolio of a student who holds a stock that listed later would leave the chart, although it is the point that the student came to see.
- **Each stock against the line of its own months.** One chart would hold a line for each set of months, which a reader cannot tell apart on a phone or on a projector, because the palette of decision 0012 has one strong color.
- **Every stock measured again over the months of the portfolio.** Every stock would lie against the line, but the chart would show each stock that the portfolio does not hold with numbers that neither the table of every stock nor the page of the stock shows. The stocks of the portfolio already have such numbers, which the table of the stocks of the portfolio shows beside the measures of the portfolio.
- **A stop of the keyboard and a name for each point.** About 45 points would each take a stop of the keyboard and a name in both languages, while the table already gives every point to a keyboard, to a screen reader, and to a student who checks a number by hand.

## Consequences

- A student who buys a stock that listed later sees the stocks with more months leave the chart, and the page names them, because the line of the portfolio then uses the fewer months. The stocks of the portfolio move to their measures over the fewer months.
- Each point of the chart has the numbers that the page shows for it elsewhere, because all of them come from the measures that `read-measures.server.ts` reads. A stock of a portfolio with measures has the numbers of the table of the stocks of the portfolio, over the months of the portfolio, which can differ from those of the table of every stock and of the page of the stock, as that table says. Every other stock has the numbers of the table of every stock and of its own page.
- A label that has no room beside its point is left out, so the table of the points is the one place that names every point.
