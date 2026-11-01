# 0014. Students trade the stocks of the LQ45

- Status: Accepted. [Decision 0015](0015-students-buy-only-stocks-that-the-measures-can-use.md) changes two of its rules for trading. A student buys only the stocks of the universe that have the monthly returns that the measures need, and a student can sell the shares of a holding even after its stock leaves the universe.
- Date: 2026-11-01

## Context

A student needs enough stocks from enough sectors to build a diversified portfolio, and every stock needs a delayed price and a daily history that the measures can use. IDX lists more than 900 stocks, and many of them trade too thinly for their prices to mean much. Decision 0001 asks for a low load on Yahoo Finance, so every tracked stock costs requests. Indonesian finance courses and theses usually draw their examples from the LQ45, the 45 most liquid stocks of IDX, which IDX reviews every three months.

## Decision

- The universe of stocks that students trade is the LQ45. Each period of the index is data with the dates it applies and the announcement of IDX that set it, as decision 0002 asks for IDX rules. A new period is added when IDX announces its review.
- Portolab tracks the IHSG and every stock of every recorded period, so a stock that leaves the index keeps a current price.
- The price job asks Yahoo Finance for the quotes of every tracked instrument in one request each minute during the price hours.
- After each trading day closes, the job asks for the whole daily history that the measures need, one instrument at a time, with a pause between requests. Yahoo adjusts the earlier closes of a stock after a split, sometimes days later, so asking for the whole history each time brings that adjustment to every stored close. A run stops after three failures in a row, so an outage costs few requests.

## Alternatives

- **The IDX80 or the Kompas100.** More choice, but more requests, and more thinly traded stocks whose betas say little.
- **Every listed stock.** A real broker's choice, at a load on Yahoo that decision 0001 rules out, and with prices that thin trading makes meaningless for the measures.
- **A list that the lecturer chooses.** Flexible, but it needs class settings that do not exist yet, and a lecturer still needs a sensible default.

## Consequences

- Every stock in the universe has a liquid market, so its delayed price is close to what a broker would show.
- The universe covers banks, mining, energy, consumer goods, telecommunications, and technology, so a student can diversify across sectors.
- Some members listed recently, so they have fewer monthly returns than the measures need, and the measures say so instead of computing them.
- Someone must add the next period after each review of IDX, and the price job warns while no recorded period covers a trading day. The tracked stocks grow by the few stocks that each review replaces.
