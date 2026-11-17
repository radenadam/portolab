import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readTradingPortfolio } from "~/features/trading/read-trading-portfolio.server";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import { portfolioWeightOf } from "~/features/trading/portfolio-weight-of";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import { explainPortfolioMeasures } from "~/features/measures/explain-portfolio-measures";
import { wibDateOf } from "~/wib";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { listIndexHistory, listStockHistory } from "./history-store.server";
import { marketIndex } from "./tracked-instruments";
import { readPrices } from "./read-prices.server";
import { priceChartStart } from "./price-chart-range";
import {
  marketRangeChange,
  marketPortfolioChange,
} from "./market-range-change";
import type { MarketRange } from "./market-filters";

export function readMarketMap(
  context: Readonly<RouterContextProvider>,
  input: { request: Request; url: URL; classId: string; now: Date },
  range: MarketRange,
) {
  const database = context.get(databaseContext);
  const member = readTradingPortfolio(context, input);
  const { valuation } = readPortfolioValuation(database, {
    portfolio: member.portfolio,
    startingCash: member.place.owner.startingCash,
  });
  const measures = explainPortfolioMeasures(
    readPortfolioMeasures(database, valuation),
    {
      kind: "owner",
      classId: member.place.classId,
      portfolioKind: member.place.owner.kind,
    },
  );
  const prices = readPrices(context, input.now);
  const from = priceChartStart(wibDateOf(input.now), range);
  const changes = prices.quotes.map((quote) => ({
    code: quote.code,
    change:
      quote.kind === "stock"
        ? marketRangeChange(
            listStockHistory(database, quote.code).closes,
            from,
            {
              value: splitAdjustedRupiah(quote.price),
              quotedAt: quote.quotedAt,
            },
          )
        : marketRangeChange(
            listIndexHistory(database, quote.code).closes,
            from,
            {
              value: quote.level,
              quotedAt: quote.quotedAt,
            },
          ),
  }));
  const total = valuation.total;
  const portfolioChange =
    total === undefined
      ? undefined
      : marketPortfolioChange(
          valuation.holdings.flatMap((holding) =>
            holding.kind === "priced"
              ? [
                  {
                    weight: portfolioWeightOf(holding.value, total.value),
                    change: changes.find((stock) => stock.code === holding.code)
                      ?.change,
                  },
                ]
              : [],
          ),
        );
  return {
    from,
    changes,
    marketChange: changes.find((stock) => stock.code === marketIndex.code)
      ?.change,
    heldCodes: valuation.holdings.map((holding) => holding.code),
    portfolio:
      measures.ok && portfolioChange !== undefined
        ? {
            beta: measures.value.beta,
            standardDeviation: measures.value.standardDeviation,
            change: portfolioChange,
          }
        : undefined,
    portfolioFailure: measures.ok ? undefined : measures.failure,
  };
}
