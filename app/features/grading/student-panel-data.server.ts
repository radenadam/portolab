import type { Database } from "~/database/database.server";
import type { OrderSide } from "~/features/trading/order";
import type { Portfolio } from "~/features/trading/portfolio-store.server";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import type { PortfolioValuation } from "~/features/trading/value-portfolio";
import type { OrderLots } from "~/units/lots";
import type { Rupiah } from "~/units/rupiah";

export interface StudentPanelData {
  valuation: PortfolioValuation;
  orderCount: number;
  reason:
    | {
        code: string;
        side: OrderSide;
        lots: OrderLots;
        reason: string;
        filledAt: Date;
      }
    | undefined;
}

export function studentPanelData(
  database: Database,
  portfolio: { portfolio: Portfolio; startingCash: Rupiah },
): StudentPanelData {
  let reason: StudentPanelData["reason"];
  for (const order of portfolio.portfolio.orders) {
    if (
      order.state.kind === "filled" &&
      order.reason !== undefined &&
      (reason === undefined || order.state.fill.filledAt >= reason.filledAt)
    ) {
      reason = {
        code: order.code,
        side: order.side,
        lots: order.lots,
        reason: order.reason,
        filledAt: order.state.fill.filledAt,
      };
    }
  }
  return {
    valuation: readPortfolioValuation(database, portfolio).valuation,
    orderCount: portfolio.portfolio.orders.length,
    reason,
  };
}
