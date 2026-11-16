import type { Portfolio } from "./portfolio-store.server";

/** readPortfolio orders records by placement time and id, so the last record is the latest activity. */
export function latestPortfolioActivity(
  portfolio: Pick<Portfolio, "orders">,
): Date | undefined {
  return portfolio.orders.at(-1)?.placedAt;
}
