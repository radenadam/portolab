# 0047. Current returns share one snapshot

- Status: Accepted
- Date: 2026-11-16

## Context

[Decision 0018](0018-a-portfolio-returns-at-each-final-daily-close.md) allowed the daily return chart to stop at a final close while the portfolio value and map used delayed quotes. On the demonstration portfolio, the chart showed 0.00% while the map showed -0.07% for the same period. The references put the same current return in both places. The shared report also serves Beranda, Analisis, Kelas, and the lecturer's view of a student.

## Decision

- The current portfolio valuation and IHSG comparison are read once for a portfolio report. Its chart ends with those returns. The latest quote time among the holdings and IHSG, or a later fill time, labels this snapshot. Cash after a complete sale therefore includes that sale even when no holding quote remains. An IHSG quote before the moment of the base close has no current return. The same close boundary also guards the timed point. It uses the closing auction matching start in the dated IDX calendar, not the end of post-closing trading or the final arrival time of delayed prices. The recorded closing IHSG quote at 16:00:05 WIB and stock quotes around 16:14 WIB remain valid.
- Earlier trading days keep their final stored closes and the replay of their own fills under decision 0018. A timestamped snapshot is a separate kind of point. It never becomes a daily close. When cached quotes are older than stored closes, the chart shows only the earlier days before that snapshot and the timestamped snapshot itself.
- Missing closes stop the daily portion under decision 0018. They do not stop an available current snapshot. The notices state what daily close points need. When stored closes extend beyond the snapshot, the chart explains its time cutoff and the newer quotes or fills that advance it. A missing calendar keeps its recovery step. Without a fully priced current valuation or an IHSG return from the base close, the chart keeps its dated final points.
- The endpoint time is visible on the time axis and appears with the date in the table, slider, and tooltip. Holdings and IHSG keep their individual quote times and failed-update notices, so the snapshot does not imply that a missing quote was refreshed.
- Each holding's sparkline also ends at its displayed quote, whose time is beside the price. Its earlier points use final closes from the month before that quote, so a stale quote cannot sit after newer daily prices.
- Kelas compares each current student valuation with the latest IHSG over that student's own period. Its headline and map use those same comparisons. Analisis keeps its monthly expected-return map separate from its cumulative performance chart.

## Alternatives

- Keeping the final-close endpoint preserves the previous behavior but leaves different returns for the same period on one screen.
- Repricing the whole screen at the last final close would make the chart agree but hide the effect of today's prices and trades.
- Saving every intraday snapshot needs new storage and retention rules. This change needs only the current point, so it reads the stored quotes and fills already used by the valuation.

## Consequences

This replaces the latest-return rule of decision 0018, the scope of missing closes, its consequence about the points of a chart, and its rejection of a current quote endpoint. Its rules for final daily points and the return start remain. Both languages explain the endpoint in the existing help. Regression tests compare the screen elements against independent calculations with quotes newer than daily closes. The product lens exercises that state under the one-moment standard in AGENTS.md.
