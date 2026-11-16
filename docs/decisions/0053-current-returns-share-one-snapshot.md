# 0053. Current returns share one snapshot

- Status: Accepted. [Decision 0054](0054-trade-impact-has-measured-allowances-for-its-combined-screens.md) replaces its JavaScript ceiling for demonstration analysis and its consequence that stock JavaScript and CSS and student analysis JavaScript keep their earlier ceilings.
- Date: 2026-11-16

## Context

[Decision 0018](0018-a-portfolio-returns-at-each-final-daily-close.md) allowed the daily return chart to stop at a final close while the portfolio value and map used delayed quotes. On the demonstration portfolio, the chart showed 0.00% while the map showed -0.07% for the same period. The references put the same current return in both places. The shared report also serves Beranda, Analisis, Kelas, and the lecturer's view of a student.

The complete lesson sheets of [decision 0049](0049-complete-lesson-sheets-have-measured-route-allowances.md) bring demonstration analysis to 199.47 kB of JavaScript on main at `dae8e09`. The timed endpoint at `c1cbf12` brings it to 200.30 kB, which exceeds its existing ceiling by 303 bytes. The same installed dependencies and localization plugin build both revisions. Size Limit uses the complete dependency graph and gzip method of decision 0038. CSS remains 19.24 kB on this route.

## Decision

- The current portfolio valuation and IHSG comparison are read once for a portfolio report. Its chart ends with those returns. The latest quote time among the holdings and IHSG, or a later fill time, labels this snapshot. Cash after a complete sale therefore includes that sale even when no holding quote remains. An IHSG quote before the moment of the base close has no current return. The same close boundary also guards the timed point. It uses the closing auction matching start in the dated IDX calendar, not the end of post-closing trading or the final arrival time of delayed prices. The recorded closing IHSG quote at 16:00:05 WIB and stock quotes around 16:14 WIB remain valid.
- Earlier trading days keep their final stored closes and the replay of their own fills under decision 0018. A timestamped snapshot is a separate kind of point. It never becomes a daily close. When cached quotes are older than stored closes, the chart shows only the earlier days before that snapshot and the timestamped snapshot itself.
- Missing closes stop the daily portion under decision 0018. They do not stop an available current snapshot. The notices state what daily close points need. When stored closes extend beyond the snapshot, the chart explains its time cutoff and the newer quotes or fills that advance it. A missing calendar keeps its recovery step. Without a fully priced current valuation or an IHSG return from the base close, the chart keeps its dated final points.
- The endpoint time is visible on the time axis and appears with the date in the table, slider, and tooltip. Holdings and IHSG keep their individual quote times and failed-update notices, so the snapshot does not imply that a missing quote was refreshed.
- Each holding's sparkline also ends at its displayed quote, whose time is beside the price. Its earlier points use final closes from the month before that quote, so a stale quote cannot sit after newer daily prices.
- Kelas compares each current student valuation with the latest IHSG over that student's own period. Its headline and map use those same comparisons. Analisis keeps its monthly expected-return map separate from its cumulative performance chart.
- The JavaScript ceiling of `features/measures/demonstration-analysis-page` is 201 kB gzip. This is an exact route entry in `clientRouteLimits`. Every other JavaScript ceiling, every CSS ceiling, and the dependency graph and compression method keep their existing rules.

The phone comparison uses Chromium at 360 pixels with touch, fourfold CPU slowdown, a disabled cache, 150 ms latency, 200,000 bytes per second downstream, and 93,750 upstream. Each build uses the same recorded BBCA and IHSG fixture of `returnSnapshotServer`, with a filled portfolio and a quote newer than the last daily close. Both handlers use the same request services and database setup. The baseline serves its own built handler and assets. The fixture serves assets without proxy compression, so the comparison measures that controlled setup.

Three cold visits to demonstration analysis on each build give these medians. Ready time is `performance.now()` after navigation loads and the performance chart's slider appears.

| Build                     | First contentful paint, seconds | Ready time, seconds |
| ------------------------- | ------------------------------: | ------------------: |
| Main at `dae8e09`         |                           2.836 |               6.994 |
| With the current endpoint |                           2.892 |               7.072 |

All six recorded chart key steps on the changed build finish within 120 ms, including Playwright and two animation frames. The measured ready-time increase is 0.078 seconds. These local measurements support the narrow allowance for this fixture. They do not measure every phone or portfolio.

## Alternatives

- Keeping the final-close endpoint preserves the previous behavior but leaves different returns for the same period on one screen.
- Repricing the whole screen at the last final close would make the chart agree but hide the effect of today's prices and trades.
- Saving every intraday snapshot needs new storage and retention rules. This change needs only the current point, so it reads the stored quotes and fills already used by the valuation.
- Giving demonstration analysis the 220 kB allowance of the lecturer's student analysis route would pass too. Its measured cost needs only the narrower allowance above.

## Consequences

This replaces the latest-return rule of decision 0018, the scope of missing closes, its consequence about the points of a chart, and its rejection of a current quote endpoint. Its rules for final daily points and the return start remain. Both languages explain the endpoint in the existing help and lecturer guide. Regression tests compare the screen elements against independent calculations with quotes newer than daily closes. The product lens exercises that state under the one-moment standard in AGENTS.md. The budget test checks the new route allowance and its existing CSS ceiling through `clientSizeChecks`.
