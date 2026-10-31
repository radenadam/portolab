# 0008. Lightweight Charts and SVG draw the charts

- Status: Accepted
- Date: 2026-10-31

## Context

The first release draws prices over time, portfolio value against the IHSG over time, and the security market line, which plots expected return against beta. Charts must work with touch on phones, be accessible, and stay small for mobile data.

## Decision

- A chart with time on its horizontal axis uses TradingView's Lightweight Charts 5 and its accessibility plugin.
- Every other chart, such as the security market line, is an SVG component in this repository.
- Both kinds use the same design tokens.

## Alternatives

- **Apache ECharts 6 for every chart.** One library, but large on mobile data even when trimmed, and its accessibility support is opt-in.
- **Recharts 3.** Accessible by default, but its touch behavior is undocumented, and it has an open keyboard bug.
- **visx.** Small and flexible, but every interaction would be built by hand.

## Consequences

- Charts have two implementations, divided by one rule: time on the horizontal axis means Lightweight Charts.
- SVG charts are written and tested here, so they can be exactly as accessible as the course needs.
