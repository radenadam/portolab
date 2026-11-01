# 0015. Students buy only stocks that the measures can use

- Status: Accepted
- Date: 2026-11-01

## Context

Decision 0013 computes the measures of a stock from at least 24 monthly returns, and the measures of a portfolio only from the months that all its stocks share. So one stock with a short history takes the measures away from the whole portfolio that holds it. The course sessions on CAPM and on portfolio return and risk ask each student to read the measures of their own portfolio. AADI, which listed in December 2024, is in the LQ45 from 2 November 2026, and on 1 November 2026 it had 21 monthly returns.

## Decision

- A student can buy a stock only when it is in the universe of decision 0014 on the trading day of the order and has at least as many monthly returns as the measures need. The returns are counted with the settings of the measures, so a change of the minimum reaches this rule by itself.
- A stock without enough returns still shows on the prices page. An order to buy it fails with a text that gives its returns, the minimum, and the month whose first trading day brings enough once it closes, if the stock keeps a close at the end of every month and stays in the universe.
- A student can always sell the shares of a holding, even of a stock that has left the universe.

## Alternatives

- **Letting every stock of the universe trade, with a screen that explains the missing measures.** Closer to a broker, which lets anyone buy a stock soon after it lists. But one purchase would take the measures away from a whole portfolio until the stock has 24 returns, which for AADI is January 2027, after the sessions on CAPM.

## Consequences

- A portfolio has its measures, so the sessions on CAPM and on portfolio return and risk can rely on them. The rule checks each stock against the market alone, but the measures of a portfolio use only the months that all its stocks share. So a portfolio can still lose its measures when its stocks lack the close of different months, such as after a suspension, and the measures then name the stock with the fewest returns.
- A stock that joins the LQ45 soon after it lists waits up to two years before students can buy it, and the rejection of an order says until when.
