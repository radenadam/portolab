# 0021. The lecturer ranks portfolios by their distance from the security market line

- Status: Accepted
- Date: 2026-11-11

## Context

The lecturer of a class follows the portfolio of every student between meetings and grades it, as issue #10 asks. A list of a whole class needs an order, and the section "Non-goals" of `docs/product.md` rules out an order by raw return, because teaching research finds that it pushes students toward gambling. StockTrak lets a lecturer rank students by the Sharpe ratio, by alpha, or by beta instead.

The first release serves the course sessions on CAPM and on portfolio return and risk. Decision 0013 gives every portfolio with enough monthly returns its expected return, its standard deviation, its beta against the IHSG, the return that CAPM requires for that beta, and the distance of the expected return from the security market line, all per month. The performance measures of Sharpe, Treynor, and Jensen come in a later release, as `docs/product.md` lists them.

## Decision

- The page of the portfolios of a class lists first the students whose portfolios have measures, from the highest distance from the security market line to the lowest. Students with the same distance keep the order in which they joined the class.
- The students whose portfolios have no measures follow, in the order in which they joined, each with the text that explains why and when the measures come.
- Each student shows the distance, the expected return, the standard deviation, the beta, the return that CAPM requires, the total value, and the return since the start. The value and the return since the start inform the lecturer, but they never set the order.
- Only the lecturer of the class sees the list, and the workbook of decision 0022 keeps its order.

## Alternatives

- **The Sharpe ratio.** It is the measure of return for risk that most courses and StockTrak use, but Portolab does not compute it yet, so the lecturer would rank by a number that no page of a student shows or explains with a formula. It comes with the later release of the performance measures.
- **The Treynor ratio.** It divides by beta, as the distance does, but it is a measure of the later release as well.
- **A measure that the lecturer chooses.** It adds a control and a state to the page of the first release. The workbook holds every measure, so a lecturer who grades by another one sorts the spreadsheet.
- **The return since the start.** The section "Non-goals" of `docs/product.md` rules it out.

## Consequences

- A portfolio ranks by how far the expected return of its stocks at their current weights lies above the return that CAPM requires for its beta, over the months of its measures. So the rank judges the choice of stocks and weights by the model of the course, not the luck of the weeks of the class.
- Cash earns no return in Portolab, while the risk-free rate is above zero, so the distance of a portfolio is the sum of the distances of its stocks times their weights, less the weight of its cash times the risk-free rate of a month. Cash that a student leaves idle lowers the rank.
- The measures of two portfolios can use different months, when a stock of one of them has fewer returns, so their distances can come from different windows of the same history.
- Once the later release adds the measures of Sharpe, Treynor, and Jensen, a lecturer may want to rank by one of them, which issue #93 tracks.
