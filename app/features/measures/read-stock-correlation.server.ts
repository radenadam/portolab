import type { Database } from "~/database/database.server";
import type { PortfolioValuation } from "~/features/trading/value-portfolio";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { rupiah } from "~/units/rupiah";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { ReturnMeasure } from "./aligned-returns";
import { measureStoredPortfolio } from "./measure-stored.server";
import type { StoredMeasureFailure } from "./measure-stored.server";
import type { CorrelationMeasure } from "./return-statistics";
import { monthSpanOf } from "./month-span";
import type { MonthSpan } from "./month-span";

export type StockCorrelation = Result<
  {
    correlation: CorrelationMeasure;
    months: MonthSpan;
    instruments: {
      code: string;
      weight: PortfolioWeight;
      returns: readonly ReturnMeasure[];
    }[];
    cashWeight: PortfolioWeight;
  },
  | { kind: "noHoldings" }
  | { kind: "unpriced"; codes: string[] }
  | { kind: "noPortfolioVariation" }
  | { kind: "unmeasured"; failure: StoredMeasureFailure }
>;

/** The stock enters without weight when it is not held, so its returns and the portfolio use exactly the same months. */
export function readStockCorrelation(
  database: Database,
  code: string,
  valuation: PortfolioValuation,
): StockCorrelation {
  if (valuation.holdings.length === 0) return fail({ kind: "noHoldings" });
  if (valuation.total === undefined) {
    return fail({ kind: "unpriced", codes: valuation.unpricedCodes });
  }
  const holdings = valuation.holdings.flatMap((holding) =>
    holding.kind === "priced"
      ? [{ code: holding.code, value: holding.value }]
      : [],
  );
  if (!holdings.some((holding) => holding.code === code)) {
    holdings.push({ code, value: rupiah(0) });
  }
  const measured = measureStoredPortfolio(database, {
    cash: valuation.cash,
    holdings,
  });
  if (!measured.ok) {
    return fail({ kind: "unmeasured", failure: measured.failure });
  }
  const risks = measured.value.holdingRisks;
  if (!risks.ok) return risks;
  const stock = risks.value.find((holding) => holding.code === code);
  if (stock === undefined) {
    throw new Error(`The measured portfolio has no risk for ${code}.`);
  }
  return succeed({
    correlation: stock.correlationWithPortfolio,
    months: monthSpanOf(measured.value.market.returns),
    instruments: measured.value.holdings.map(({ code, weight, returns }) => ({
      code,
      weight,
      returns,
    })),
    cashWeight: measured.value.cashWeight,
  });
}
