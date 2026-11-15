import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readPortfolioReport } from "./read-portfolio-report.server";
import type { PortfolioOwner } from "./portfolio-store.server";
import { readTradingPortfolio } from "./read-trading-portfolio.server";

export function readOwnedPortfolioReport(
  context: Readonly<RouterContextProvider>,
  input: { request: Request; url: URL; classId: string; now: Date },
  kind: PortfolioOwner["kind"] = "membership",
) {
  const { place, portfolio, source } = readTradingPortfolio(
    context,
    input,
    kind,
  );
  const report = readPortfolioReport(
    context.get(databaseContext),
    {
      portfolio,
      startingCash: place.owner.startingCash,
      joinedAt: place.joinedAt,
    },
    { now: input.now, delayMinutes: source.delayMinutes },
  );
  return { place, portfolio, report, source };
}
