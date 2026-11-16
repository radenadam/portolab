import type { Database } from "~/database/database.server";
import type { PortfolioOwner } from "./portfolio-store.server";
import {
  readPortfolio,
  savePlacedOrder,
  saveOrderState,
  saveFill,
} from "./portfolio-store.server";
import { applySampleFill } from "./sample-trades";
import type { SampleTrade } from "./sample-trades";
import type { AccountState } from "./place-order";
import { holdingAfterFill } from "./holding-after-fill";

export function saveSamplePortfolio(
  database: Database,
  owner: PortfolioOwner,
  trades: readonly SampleTrade[],
): void {
  let account: AccountState = readPortfolio(database, owner);
  for (const trade of trades) {
    const saved = savePlacedOrder(database, owner, trade.accepted);
    saveOrderState(database, saved.orderId, trade.state);
    const after = applySampleFill(account, trade);
    if (trade.state.kind === "filled") {
      const holding = holdingAfterFill(
        account.holdings.find((held) => held.code === trade.accepted.code),
        trade.accepted,
        trade.state.fill,
      );
      saveFill(database, saved.portfolioId, { cash: after.cash, holding });
    }
    account = after;
  }
}
