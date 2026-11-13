# 0031. Sharpe, Treynor, and Jensen's alpha are measures of the first release

- Status: Accepted
- Date: 2026-11-14

## Context

The design "Peta" that the maintainer approved for the rebuild of issue #127 shows the Sharpe ratio, the Treynor ratio, and Jensen's alpha of a portfolio on the home of a student, on the analysis, and in the ranking of the lecturer. The analysis also shows how much of the risk of a portfolio each stock adds, and the order ticket and the page of a stock show what a trade changes before the student places the order. `docs/product.md` had placed the performance measures of Sharpe, Treynor, and Jensen in a later release, and decision 0021 ranked the portfolios of a class by their distance from the security market line because Portolab did not compute those measures yet.

Bodie, Kane, and Marcus define the three measures of a portfolio p from its average return, the average risk-free rate, and the average return of the market over a period:

- The Sharpe ratio divides the return above the risk-free rate by the standard deviation of the portfolio, which counts every risk of the portfolio.
- The Treynor ratio divides the same return by beta, which counts only the risk of the market.
- Jensen's alpha is the return above the one that CAPM requires for the beta of the portfolio. Jensen estimated it as the intercept of a regression of the returns of the portfolio above the risk-free rate on those of the market.

Decision 0013 already gives every input of the three over one table of monthly returns: the expected return, the standard deviation, and the beta of a portfolio, the risk-free rate of the last month of the window, and the expected return of the IHSG. It also gives the distance of a portfolio from the security market line, which decision 0020 writes as α.

Two inputs make a ratio meaningless. A portfolio whose returns are the same in every month, such as cash alone, has a standard deviation of zero, so the Sharpe ratio divides by zero. A beta of zero makes the Treynor ratio divide by zero too, and a beta below zero turns a return below the risk-free rate into a positive ratio, so a higher ratio would no longer mean a better portfolio.

## Decision

- **Sharpe ratio.** S<sub>p</sub> = (E(R<sub>p</sub>) − R<sub>f</sub>) / σ<sub>p</sub>, from the measures of the portfolio that decision 0013 gives, per month.
- **Treynor ratio.** T<sub>p</sub> = (E(R<sub>p</sub>) − R<sub>f</sub>) / β<sub>p</sub>, per month, so it is a monthly return for each unit of beta.
- **Jensen's alpha.** The distance α<sub>p</sub> = E(R<sub>p</sub>) − k<sub>p</sub> from the security market line, under the name of the course. Decision 0013 takes one risk-free rate for every month of the window and a beta from returns that are not in excess of that rate, so the distance equals the intercept of Jensen's regression.
- **The risk that each stock adds.** The covariance of a stock with its portfolio is σ<sub>ip</sub> = Σ<sub>j</sub> w<sub>j</sub> σ<sub>ij</sub>, the share of the variance of the portfolio that the stock adds is c<sub>i</sub> = w<sub>i</sub> σ<sub>ip</sub> / σ²<sub>p</sub>, and the correlation of the stock with the portfolio is ρ<sub>ip</sub> = σ<sub>ip</sub> / (σ<sub>i</sub> σ<sub>p</sub>). The shares of the stocks add up to 1, because the variance of the portfolio is the sum of each weight times the covariance of its stock with the portfolio, and cash adds nothing.
- **Measures that a portfolio cannot have.** A portfolio whose variance is zero has no Sharpe ratio, no share of its variance, and no correlation with a stock. A portfolio whose beta is at or below zero has no Treynor ratio. Each is a typed failure, and the page says why in place of the value.
- **Symbols.** S for Sharpe, T for Treynor, and c for the share that a stock contributes, with the subscripts of decision 0020.
- **What a trade changes.** The portfolio is measured before and after a trade over the months in which the IHSG, every stock of the portfolio, and the stock of the trade have a return, as decision 0013 sets for a portfolio and all its stocks. A stock that the portfolio does not hold enters the measures before the trade without weight. Every share is valued at the latest delayed price of its stock before and after the trade, and the cash after the trade changes by the value of the trade at its own price and by the costs of decision 0016. So the two measures differ by the trade alone.

## Alternatives

- **Ratios per year.** A Sharpe ratio times √12 and a Treynor ratio times 12 compare with the figures of fund factsheets, but decision 0013 keeps every measure per month, so that a student sees the numbers of the table of monthly returns.
- **The average of the monthly returns above the rate of each month.** It follows the textbook exactly when the rate changes within the window, but decision 0013 takes one rate for the window, and a student would need a column of rates in the spreadsheet.
- **A Treynor ratio for any beta.** It always gives a number, but for a beta below zero a higher number can mean a worse portfolio, so a student or a ranking would read it the wrong way.
- **The marginal contribution σ<sub>ip</sub> / σ<sub>p</sub> instead of the share of the variance.** It is the rate at which the standard deviation of the portfolio grows with the weight of a stock, so a student cannot compare it with the weight. The share of the variance adds up to the whole risk, which the design compares with the weight of each stock.
- **A trade measured over the months of the portfolio alone.** A stock of the trade that listed later has no returns in some of those months, and measuring the portfolio after the trade over fewer months than before would mix the trade with the change of the months.

## Consequences

- The page of the measures of a portfolio shows the Sharpe ratio and the Treynor ratio with their formulas and inputs, Jensen's alpha under its name, and the risk that each stock adds. The ranking of decision 0021 names its order Jensen's alpha, and issue #93 tracks a choice of the Sharpe or the Treynor ratio.
- Cash earns no return in Portolab, so cash that a student leaves idle lowers the Sharpe ratio, the Treynor ratio, and Jensen's alpha alike.
- The measures of a trade wait for the order ticket and the page of a stock of issue #127, which show them.
