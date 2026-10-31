# 0001. Delayed prices come from Yahoo Finance

- Status: Accepted
- Date: 2026-10-31

## Context

The course needs real market prices, not generated ones. Real-time IDX data requires a display license from IDX. Its 2026 price list could not be read, and the one figure found suggests about Rp20 million per month for indirect real-time access, which is far beyond the budget. Licensed end-of-day data costs about 59 US dollars per month from Sectors, whose terms for showing data to end users are not published. Yahoo Finance offers IDX quotes delayed by 10 minutes, and daily history back to 2004 for large stocks and back to 1990 for the IHSG, at no cost. Its terms forbid automated collection and redistribution, and it throttled unofficial clients repeatedly during 2026.

## Decision

Portolab fetches delayed quotes and daily history from Yahoo Finance through the `yahoo-finance2` library, on the server only. The maintainer accepted the risk of Yahoo's terms for a free classroom tool. All price requests go through one price source interface, every price is stored in the database, and the app keeps working with the last stored prices when Yahoo fails.

## Alternatives

- **Sectors end-of-day API.** Licensed and reliable, but it costs money every month, its terms for classroom display are unconfirmed, and it has no intraday prices.
- **Licensed real-time IDX data.** The best data, at a cost the project cannot carry.
- **Academic use of IDX data through a campus investment gallery.** IDX allows academic use of gallery data, but permission for an app is uncertain and slow to obtain. It remains a path to better data later.

## Consequences

- The data costs nothing.
- Yahoo can fail or throttle without warning, and it could enforce its terms. The price source interface lets a licensed source replace Yahoo without changes elsewhere.
- Requests are batched, cached, and backed off to keep the load on Yahoo low.
- The interface always states that prices are delayed.
