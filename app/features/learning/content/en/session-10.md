# Portfolio return and risk

## summary

Use weights for return, then include covariance for risk.

## key-idea

Portfolio return is a weighted average, but its risk also depends on relationships between assets.

## body

Separate a realised result from an estimate. The change in portfolio value while you manage it is the result for that period. Historical average asset returns with today's weights estimate the current allocation rather than reconstruct the result of your trades.

{{formula:weighted-return}}

Weights describe each asset's share of total value, including cash. Changing weights changes estimated return and risk. Cash in Portolab earns no interest, so it does not earn the BI-Rate.

Variance records the spread of returns, while covariance records how two returns move together. Portfolio variance includes both. Standard deviation is the square root of variance and returns to the units of return.

{{formula:variance}}

{{formula:covariance}}

{{formula:portfolio-variance}}

A stock's share of portfolio variance can differ greatly from its weight. A negative contribution is possible when a stock offsets portfolio movements. This contribution is not an amount of money you will lose.

{{formula:variance-share}}

Sharpe compares return above the risk-free rate with total risk. Treynor compares it with beta. They answer different questions, so they can rank portfolios differently.

{{formula:sharpe}}

{{formula:treynor}}

Sharpe is undefined when standard deviation is zero. Treynor is undefined when beta is zero, and ranking by a higher value can mislead when beta is negative. Portolab does not show Treynor for a beta that is not positive.

Compare measures over the same period and frequency. Historical prices without dividends measure price changes rather than an investor's entire income. Measured results do not guarantee future results.

## interactive

## terms

- bobot
- kovarians
- kontribusi-risiko
- rasio-sharpe
- rasio-treynor

## practice
