import type { Database } from "~/database/database.server";
import { startOfWeek } from "~/calendar-dates";
import { holdingQuoteFailureText } from "~/features/trading/holding-quote-failure-text";
import { readCurrentPortfolio } from "~/features/trading/read-current-portfolio.server";
import { readPortfolioReport } from "~/features/trading/read-portfolio-report.server";
import type { ValuationReport } from "~/features/trading/read-portfolio-report.server";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import { explainPortfolioMeasures } from "~/features/measures/explain-portfolio-measures";
import { measureStoredMarket } from "~/features/measures/measure-stored.server";
import { formatMarketTime, formatList } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Beta } from "~/units/beta";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { CumulativeReturn } from "~/units/cumulative-return";
import { wibDateOf } from "~/wib";
import { listStudents } from "./class-store.server";
import type { ClassStudent, TaughtClassRecord } from "./class-store.server";
import { classSummary } from "./class-summary";

type OverviewClass = Pick<TaughtClassRecord, "id" | "startingCash">;

interface OverviewStudent extends Pick<
  ClassStudent,
  "id" | "name" | "username" | "joinedAt"
> {
  return: CumulativeReturn | undefined;
  marketReturn: CumulativeReturn | undefined;
  risk:
    | { beta: Beta; standardDeviation: MonthlyReturn; alpha: MonthlyReturn }
    | undefined;
  reason: string | undefined;
  ordersThisWeek: number;
  lastOrder: string;
  priceTimes: string;
}

/** The portfolios of a class, with only the values and texts that its overview draws. */
export interface ClassOverview {
  students: OverviewStudent[];
  summary: ReturnType<typeof classSummary>;
  marketDeviation: MonthlyReturn | undefined;
  quoteFailure: string | undefined;
  active: number;
  ordersThisWeek: number;
  pricesAt: string | undefined;
}

/** Every portfolio must use one moment, so order activity and values cannot disagree within a load. */
export function readClassOverview(
  database: Database,
  taught: OverviewClass,
  {
    request,
    now,
    delayMinutes,
  }: { request: Request; now: Date; delayMinutes: number },
): ClassOverview {
  const students: OverviewStudent[] = [];
  const valuations: ValuationReport[] = [];
  const compared: { portfolio: CumulativeReturn; market: CumulativeReturn }[] =
    [];
  const risks: Beta[] = [];
  let active = 0;
  let ordersThisWeek = 0;
  let pricesAt: Date | undefined;
  for (const student of listStudents(database, taught.id)) {
    const read = readOverviewStudent(
      database,
      { taught, student },
      {
        request,
        now,
        delayMinutes,
      },
    );
    const { overview, report } = read;
    valuations.push(report);
    if (overview.risk !== undefined) risks.push(overview.risk.beta);
    if (overview.return !== undefined && overview.marketReturn !== undefined)
      compared.push({
        portfolio: overview.return,
        market: overview.marketReturn,
      });
    if (overview.ordersThisWeek > 0) active += 1;
    ordersThisWeek += overview.ordersThisWeek;
    if (
      read.pricesAt !== undefined &&
      (pricesAt === undefined || read.pricesAt > pricesAt)
    )
      pricesAt = read.pricesAt;
    students.push(overview);
  }
  const market = measureStoredMarket(database);
  return {
    students,
    summary: classSummary(compared, risks),
    marketDeviation: market.ok
      ? market.value.standardDeviation.value
      : undefined,
    quoteFailure: holdingQuoteFailureText(valuations, { now, delayMinutes }),
    active,
    ordersThisWeek,
    pricesAt:
      pricesAt === undefined
        ? undefined
        : m.app_prices_time_label({ time: formatMarketTime(pricesAt) }),
  };
}

function readOverviewStudent(
  database: Database,
  { taught, student }: { taught: OverviewClass; student: ClassStudent },
  options: { request: Request; now: Date; delayMinutes: number },
) {
  const portfolio = readCurrentPortfolio(
    database,
    { membershipId: student.membershipId, startingCash: taught.startingCash },
    options,
  );
  const report = readPortfolioReport(
    database,
    {
      portfolio,
      startingCash: taught.startingCash,
      joinedAt: student.joinedAt,
    },
    options,
  );
  const measures = explainPortfolioMeasures(
    readPortfolioMeasures(database, report.valuation),
    { kind: "lecturer", studentName: student.name },
  );
  const prices = portfolioPriceTimes(report);
  return {
    report,
    pricesAt: prices.latest,
    overview: {
      id: student.id,
      name: student.name,
      username: student.username,
      joinedAt: student.joinedAt,
      return: report.valuation.total?.return,
      marketReturn: report.market?.return,
      risk: measures.ok
        ? {
            beta: measures.value.beta,
            standardDeviation: measures.value.standardDeviation,
            alpha: measures.value.securityMarketLine.value,
          }
        : undefined,
      reason: measures.ok ? undefined : measures.failure,
      ...orderActivity(portfolio.orders, options.now),
      priceTimes: prices.text,
    },
  };
}

function orderActivity(
  orders: readonly { placedAt: Date }[],
  now: Date,
): { ordersThisWeek: number; lastOrder: string } {
  const weekStart = startOfWeek(wibDateOf(now));
  let ordersThisWeek = 0;
  let lastOrder: Date | undefined;
  for (const order of orders) {
    if (order.placedAt <= now && wibDateOf(order.placedAt) >= weekStart)
      ordersThisWeek += 1;
    if (lastOrder === undefined || order.placedAt > lastOrder)
      lastOrder = order.placedAt;
  }
  return {
    ordersThisWeek,
    lastOrder:
      lastOrder === undefined
        ? m.classes_map_no_order_label()
        : formatMarketTime(lastOrder),
  };
}

function portfolioPriceTimes(report: ReturnType<typeof readPortfolioReport>): {
  latest: Date | undefined;
  text: string;
} {
  const times: string[] =
    report.market === undefined
      ? []
      : [
          m.app_map_value_part({
            name: m.classes_map_market_label(),
            value: formatMarketTime(report.market.quote.quotedAt),
          }),
        ];
  let latest = report.market?.quote.quotedAt;
  for (const holding of report.valuation.holdings) {
    if (holding.kind !== "priced") continue;
    const quotedAt = holding.quote.quotedAt;
    if (latest === undefined || quotedAt > latest) latest = quotedAt;
    times.push(
      m.app_map_value_part({
        name: holding.code,
        value: formatMarketTime(quotedAt),
      }),
    );
  }
  return {
    latest,
    text:
      times.length === 0
        ? report.valuation.holdings.length === 0
          ? m.classes_map_cash_label()
          : m.classes_measure_pending_label()
        : formatList(times, "conjunction"),
  };
}
