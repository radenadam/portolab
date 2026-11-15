import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readPriceSourceDescription } from "~/features/market-data/price-source-context.server";
import type { PortfolioOwner } from "./portfolio-store.server";
import { readCurrentPortfolio } from "./read-current-portfolio.server";
import { findTradingPlace } from "./find-trading-place.server";
/** The caller fixes the owner kind for a portfolio page, while a stock and its ticket serve either role. */
export function readTradingPortfolio(
  context: Readonly<RouterContextProvider>,
  input: { request: Request; url: URL; classId: string; now: Date },
  kind?: PortfolioOwner["kind"],
) {
  const place = findTradingPlace(context, input.url, {
    classId: input.classId,
    kind,
  });
  const { request, now } = input;
  return {
    place,
    portfolio: readCurrentPortfolio(context.get(databaseContext), place.owner, {
      request,
      now,
    }),
    source: readPriceSourceDescription(context),
  };
}
