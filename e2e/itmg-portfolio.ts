import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import type { TestPurchase } from "./store-test-purchases.ts";

// A market purchase of the largest order that IDX accepts, 50,000 lots of ITMG, placed at 15:45 WIB on Monday 2 November 2026 and filled at a delayed price quoted at 15:49, for which the test takes Rp24,975, the close of ITMG on that day as Yahoo Finance returned it on 3 November 2026. It cost Rp124,875,000,000 and a broker fee of 0.15%, Rp187,312,500, as the decimal module of Python computed with ROUND_HALF_UP.
const itmgPurchase: TestPurchase = {
  code: "ITMG",
  lots: 50_000,
  shares: shares(5_000_000),
  tradingDay: "2026-11-02",
  placedAt: new Date("2026-11-02T08:45:00Z"),
  tradesFrom: new Date("2026-11-02T06:30:00Z"),
  expiresAt: new Date("2026-11-02T09:26:00Z"),
  price: rupiah(24_975),
  quotedAt: new Date("2026-11-02T08:49:00Z"),
  value: rupiah(124_875_000_000),
  fee: rupiah(187_312_500),
  cost: rupiah(125_062_312_500),
};

/** The portfolio of a student of a class with the most starting cash, Rp1,000,000,000,000, who joined at 17:00 WIB on Monday 26 October 2026, after the sessions of that day, and made seven such purchases, which cost Rp875,436,187,500 and left Rp124,563,812,500. No order fills before Monday 2 November 2026, the first day of the LQ45 that Portolab records, so the portfolio holds only cash at each close of October. */
export const itmgPortfolio = {
  joinedAt: new Date("2026-10-26T10:00:00Z"),
  cash: rupiah(124_563_812_500),
  holding: {
    code: "ITMG",
    shares: shares(35_000_000),
    cost: rupiah(875_436_187_500),
  },
  purchases: Array.from({ length: 7 }, () => itmgPurchase),
};
