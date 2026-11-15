import { readLessonSessions } from "~/features/learning/read-lesson-sessions.server";
import { classFlags } from "./class-flags";
import { classActivity } from "./class-activity";
import { classDiscussion } from "./class-discussion";
import { classCalendarOf } from "./course-calendar";
import type { TeachingStudent } from "./class-teaching";
import { lotCount } from "~/features/trading/count-parts";
import { studentPortfolioPath } from "~/features/grading/grading-paths";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import { studentReasonsSectionId } from "~/features/trading/student-reasons-section-id";
import { studentNameBoundary } from "./student-name-placeholder";
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

interface OverviewOptions {
  request: Request;
  now: Date;
  delayMinutes: number;
  sourcePath: string;
}

type OverviewClass = Pick<
  TaughtClassRecord,
  "id" | "startingCash" | "firstSessionDate"
>;

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
  flags: ReturnType<typeof classFlags>;
  discussion: ReturnType<typeof classDiscussion>;
  reasons: {
    key: string;
    name: string;
    heading: string;
    reason: string;
    href: string;
  }[];
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
  { request, now, delayMinutes, sourcePath }: OverviewOptions,
): ClassOverview {
  const rows: ReturnType<typeof readOverviewStudent>[] = [];
  const compared: { portfolio: CumulativeReturn; market: CumulativeReturn }[] =
    [];
  const risks: Beta[] = [];
  for (const student of listStudents(database, taught.id)) {
    const read = readOverviewStudent(
      database,
      { taught, student },
      {
        request,
        now,
        delayMinutes,
        sourcePath,
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
  }
  const { active, ordersThisWeek } = classActivity(
    rows.map((row) => row.overview),
  );
  const quotes = rows.flatMap((row) => row.quotes);
  const latest = latestQuoteTime(quotes);
  const pricesAt =
    sharedQuoteTime(quotes) ??
    (latest === undefined ? undefined : formatMarketTime(latest));
  const market = measureStoredMarket(database);
  const summary = classSummary(compared, risks);
  const lessonSessions = readLessonSessions();
  if (!lessonSessions.ok) throw new Error(lessonSessions.failure);
  const facts: TeachingStudent[] = rows.map((row) => ({
    ...row.overview,
    ...row.facts,
  }));
  const reasons = rows
    .flatMap((row) => row.reasons)
    .toSorted(
      (first, second) =>
        second.time - first.time || second.orderId - first.orderId,
    );
  return {
    flags: classFlags(facts, taught.id),
    discussion: classDiscussion(facts, {
      lessonSessions: lessonSessions.value,
      calendar: classCalendarOf(taught.firstSessionDate, now),
      summary,
      now,
    }),
    reasons: reasons.map(({ key, name, heading, reason, href }) => ({
      key,
      name,
      heading,
      reason,
      href,
    })),
    students: rows.map((row) => ({
      ...row.overview,
      priceTimes: portfolioPriceTimes(row, pricesAt),
    })),
    summary,
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
  options: OverviewOptions,
) {
  const portfolio = readCurrentPortfolio(
    database,
    {
      kind: "membership",
      membershipId: student.membershipId,
      startingCash: taught.startingCash,
    },
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
    facts: {
      holdingCount: portfolio.holdings.length,
      cash: portfolio.cash,
      value: report.valuation.total?.value,
      orderHistory:
        portfolio.orders.length === 0
          ? "none"
          : portfolio.orders.some((order) => order.state.kind === "filled")
            ? "filled"
            : "unfilled",
    } satisfies Pick<
      TeachingStudent,
      "holdingCount" | "cash" | "value" | "orderHistory"
    >,
    reasons: portfolio.orders.flatMap((order) => {
      if (order.state.kind !== "filled" || order.reason === undefined)
        return [];
      const inputs = {
        lots: lotCount(order.lots),
        code: order.code,
        time: formatMarketTime(order.state.fill.filledAt),
      };
      const headings = {
        buy: m.classes_reason_purchase_notice,
        sell: m.classes_reason_sale_notice,
      };
      return [
        {
          key: String(order.id),
          orderId: order.id,
          name: student.name,
          heading: headings[order.side](inputs),
          reason: order.reason,
          time: order.state.fill.filledAt.getTime(),
          href:
            pathReturningTo(
              studentPortfolioPath(taught.id, student.id),
              `${options.sourcePath}#class-reasons`,
            ) + `#${studentReasonsSectionId}`,
        },
      ];
    }),
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
