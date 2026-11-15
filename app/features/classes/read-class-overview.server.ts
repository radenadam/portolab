import type { Database } from "~/database/database.server";
import { startOfWeek } from "~/calendar-dates";
import { holdingQuoteFailureText } from "~/features/trading/holding-quote-failure-text";
import { readCurrentPortfolio } from "~/features/trading/read-current-portfolio.server";
import { readPortfolioReport } from "~/features/trading/read-portfolio-report.server";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import { explainPortfolioMeasures } from "~/features/measures/explain-portfolio-measures";
import { sharedQuoteTime } from "~/features/market-data/shared-quote-time";
import { latestQuoteTime } from "~/features/market-data/latest-quote-time";
import type { Quote } from "~/features/market-data/price-source.server";
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

// A name stays opaque when the view keeps formatted quantities together.
const studentNameBoundary = "\u0000";

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
  reasonParts: string[] | undefined;
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
  const rows: ReturnType<typeof readOverviewStudent>[] = [];
  const compared: { portfolio: CumulativeReturn; market: CumulativeReturn }[] =
    [];
  const risks: Beta[] = [];
  let active = 0;
  let ordersThisWeek = 0;
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
    const { overview } = read;
    rows.push(read);
    if (overview.risk !== undefined) risks.push(overview.risk.beta);
    if (overview.return !== undefined && overview.marketReturn !== undefined)
      compared.push({
        portfolio: overview.return,
        market: overview.marketReturn,
      });
    if (overview.ordersThisWeek > 0) active += 1;
    ordersThisWeek += overview.ordersThisWeek;
  }
  const quotes = rows.flatMap((row) => row.quotes);
  const latest = latestQuoteTime(quotes);
  const pricesAt =
    sharedQuoteTime(quotes) ??
    (latest === undefined ? undefined : formatMarketTime(latest));
  const market = measureStoredMarket(database);
  return {
    students: rows.map((row) => ({
      ...row.overview,
      priceTimes: portfolioPriceTimes(row, pricesAt),
    })),
    summary: classSummary(compared, risks),
    marketDeviation: market.ok
      ? market.value.standardDeviation.value
      : undefined,
    quoteFailure: holdingQuoteFailureText(
      rows.map((row) => row.report),
      { now, delayMinutes },
    ),
    active,
    ordersThisWeek,
    pricesAt:
      pricesAt === undefined
        ? undefined
        : m.classes_prices_time_label({ time: pricesAt }),
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
    { kind: "lecturer", studentName: studentNameBoundary },
  );
  const quotes: Pick<Quote, "code" | "quotedAt">[] =
    report.market === undefined ? [] : [report.market.quote];
  for (const holding of report.valuation.holdings) {
    if (holding.kind === "priced") quotes.push(holding.quote);
  }
  return {
    report,
    quotes,
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
      reasonParts: measures.ok
        ? undefined
        : measures.failure.split(studentNameBoundary),
      ...orderActivity(portfolio.orders, options.now),
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

function portfolioPriceTimes(
  { report, quotes }: ReturnType<typeof readOverviewStudent>,
  sharedTime: string | undefined,
): string {
  if (quotes.length === 0)
    return report.valuation.holdings.length === 0
      ? m.classes_map_cash_label()
      : m.classes_measure_pending_label();
  return formatList(
    quotes.map((quote) => {
      const time = formatMarketTime(quote.quotedAt);
      return time === sharedTime
        ? quote.code
        : m.app_map_value_part({ name: quote.code, value: time });
    }),
    "conjunction",
  );
}
