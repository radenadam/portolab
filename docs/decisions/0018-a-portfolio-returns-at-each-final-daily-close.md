# 0018. A portfolio returns at each final daily close since the student could trade

- Status: Accepted
- Date: 2026-11-03

## Context

The page of a portfolio shows its return over time against the IHSG, as `docs/product.md` asks. `AGENTS.md` requires a value that stands for a past moment to come from data that is final for that moment, so the return at a past day cannot come from a delayed quote, which can still change or stay behind after a failed update. Portolab already stores what such a return needs: the daily closes of the IHSG and of every tracked stock for five years, which decision 0013 asks for, and each filled order with its trading day, its shares, and the cash that it moved. The choices are how often the return is taken, from when it counts, how the value of a past day is found, and what a missing close does.

## Decision

- **Frequency.** The return is taken at the close of each trading day whose prices are final, as the calendar of IDX and the delay of the source set it.
- **Start.** The return counts from the close of the last trading day before the first session of continuous trading in which the student could trade after joining the class. When the source left out the close of the IHSG on that day, because a later close is stored, the return counts from the latest close of the IHSG before it. At either close the portfolio holds only its starting cash, so the portfolio and the IHSG both start at a return of zero.
- **Value of a day.** The fills of the orders of each trading day apply at its close, from the starting cash on. The value of a day is the cash that they leave, plus the shares of each stock times its stored close of that day. The return of the portfolio is that value against the starting cash, and the return of the IHSG is its close against its close at the start. Neither is annualized, and neither includes dividends, as in decision 0013.
- **Missing closes.** A day on which the IHSG or a stock that the portfolio holds has no stored close, while a later close is stored, is a day that the source left out, and it has no return. A close that is missing without a later one ends the returns at the day before it. The page names the instruments, and says that it shows the returns from that day on once an update of the price history stores a close of each of them on that day or on a later day, which holds whether the source has that day or left it out, and whether or not the page shows a chart yet. While the prices of the next trading day are not final, the page says when they become final.
- **The latest return.** The value at the top of the page uses the latest delayed prices. The chart and its table use only final closes, so their latest return can differ from it, and the page says so.

## Alternatives

- **Monthly returns, as the measures take them.** They match decision 0013, but a class lasts a few weeks, so the chart would have one or two points, and a student could not see what a trade did.
- **Weekly closes.** Fewer points, but a holiday splits a week, and a trade on Monday shows only on Friday.
- **A value that a job stores at each close.** It needs no replay, but it needs a new table with a time to live, and a run that the job misses leaves a day that no later run can fill. The replay computes every day again from data that Portolab keeps anyway.
- **The start of the class as the start of every student.** Every student would share one start, but a student who joined later would see the days before joining as days of cash.
- **The latest delayed quote as the last point.** The chart would reach the current moment, but the standard on past moments rules out a quote that can still change.
- **The latest close of a stock on a day that the source left out.** IDX keeps the reference price of a stock that does not trade, but Portolab cannot tell such a day from a close that the source lost, so a day without a close has no return instead.

## Consequences

- A chart has a point for each trading day since the start, about 80 in a semester, and a student can check each one from the past orders, the cash, and the closes of that day.
- Portolab does not split the shares of a holding when its stock splits, as issue #72 tracks. The history job stores closes adjusted for later splits, so once it stores the closes after a split, the value of the holding on each day before the split falls by the factor of the split, as its value after the split does.
- The lecturer view of issue #10 replays the same history for any student of a class from the orders, the starting cash, and the time when the student joined.
