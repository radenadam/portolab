# CAPM and the security market line

## summary

Distinguish market risk from total risk when judging return.

## key-idea

In CAPM, the required return depends on market risk that diversification cannot remove.

## body

Beta measures the sensitivity of returns to the market. Beta is not standard deviation. A low-beta stock can still have substantial company-specific risk and therefore high total risk.

{{formula:beta}}

CAPM connects beta to required return. It starts at the risk-free rate, then the market risk premium supplies the slope of the security market line. If the estimated market premium is negative, the line slopes down too.

{{formula:required-return}}

Portolab uses the IHSG as the market benchmark and the BI-Rate as a proxy for the risk-free rate. The BI-Rate is a policy rate rather than the return earned by cash in the simulation. Read the data and measurement assumptions alongside the results.

{{table:estimation-settings}}

{{formula:risk-free-rate}}

Expected return estimated from historical data differs from the return the model requires. The difference is Jensen's alpha. Positive alpha places a point above the line, while negative alpha places it below the line.

{{formula:jensens-alpha}}

A position above the line does not prove a price is too low and is not an instruction to buy. CAPM has assumptions, and estimates of beta and return can change. Compare results using the same benchmark, data period, and frequency.

## interactive

## terms

- beta
- capm
- premi-risiko-pasar
- alpha-jensen

## practice
