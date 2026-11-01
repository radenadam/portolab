# 0002. Orders fill at delayed prices during trading sessions

- Status: Accepted
- Date: 2026-10-31

## Context

Prices arrive late by the delay that decision 0001 records, during IDX trading sessions. The course calls for a simulator that behaves like the live market. Teaching research recommends decisions on fixed dates instead of constant trading, but a lecturer can still impose that through class rules. IDX changed its auto rejection limits twice in 2026 and lowered its minimum price in September 2026, so its rules change during a semester.

## Decision

- During IDX trading sessions, a market order fills at the latest delayed price, and a limit order fills when a later delayed price reaches its limit.
- Outside trading sessions, and on exchange holidays, orders wait for the next session.
- Fills follow IDX lots, tick sizes, auto rejection limits, fees, and the final tax on sales.
- IDX rules are stored as data with the dates they apply, never as constants in code.

## Alternatives

- **One fill per day at the closing price.** Simpler, and closer to the research advice, but it does not feel like a market, which the course calls for.
- **Fills against a real order book.** Impossible without order book data, which only licensed feeds provide.

## Consequences

- Trading feels like a broker's app.
- A fill can differ from what the exchange would give at the same moment, because the price is as old as that delay and the simulator has no order book or liquidity limit. The interface explains this.
- The price job must run every minute during sessions.
- A change in IDX rules is a data change with a start date, so past fills keep the rules that applied when they happened.
