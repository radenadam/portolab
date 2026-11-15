import { readLessonTask } from "~/features/learning/read-lesson-task.server";
import { isLq45Stock } from "./is-lq45-stock";
import { withLessonTask } from "~/features/learning/lesson-task";
import { LessonTaskBanner } from "~/features/learning/lesson-task-banner";
import { StockQuoteDetails } from "./stock-quote-details";
import { QuoteNotice } from "~/features/market-data/quote-notice";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { data, Link, useOutlet, useLocation } from "react-router";
import { ChangeText } from "~/change-text";
import { databaseContext } from "~/database/database.server";
import { requireUser } from "~/features/accounts/current-session.server";
import { requireReaderClass } from "~/features/classes/require-reader-class.server";
import { readStockMeasures } from "~/features/measures/read-measures.server";
import { readStockCorrelation } from "~/features/measures/read-stock-correlation.server";
import { StockStatisticsWindow } from "~/features/measures/stock-statistics-window";
import { StockKeyMeasures } from "~/features/measures/stock-key-measures";
import { StockMeasuresView } from "~/features/measures/stock-measures-view";
import { MethodNotice } from "~/features/measures/method-notice";
import { readStudentPortfolio } from "~/features/trading/read-student-portfolio.server";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import { holdingQuoteFailureText } from "~/features/trading/holding-quote-failure-text";
import { idxRulesOn } from "~/features/trading/idx-rules-on";
import { parseStockCode } from "~/features/trading/order-form-fields";
import { StockPosition } from "~/features/trading/stock-position";
import { TicketDraftMemory } from "~/features/trading/ticket-draft-memory";
import {
  formatRupiah,
  formatSignedPercent,
  formatSignedRupiah,
} from "~/formatting";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { rupiah } from "~/units/rupiah";
import { wibDateOf } from "~/wib";
import type { Route } from "./+types/stock-page";
import { listStockHistory } from "./history-store.server";
import { marketPath } from "./market-path";
import { readPrices } from "./read-prices.server";
import {
  attemptForCodes,
  missingQuoteText,
  quoteFailureText,
} from "./quote-failure-text";
import { quoteChange } from "./quote-change";
import { StockMetadata } from "./stock-metadata";
import { StockName } from "./stock-name";
import { stockPath } from "./stock-path";
import styles from "./stock-page.module.css";
import { StockHistoryChart } from "./stock-history-chart";
import { StockRange } from "./stock-range";
import { stockPriceRange } from "./stock-price-range";
import { parsePriceChartRange, priceChartStart } from "./price-chart-range";
import { trackedStockCodes, universeOn } from "./tracked-instruments";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: pageTitle(
        m.market_data_stock_page_title({ code: loaderData.code }),
      ),
    },
  ];
}

export function loader({ context, params, request, url }: Route.LoaderArgs) {
  const classId = requireReaderClass(context, url, params.classId);
  const parsed = parseStockCode(params.code, "code", trackedStockCodes);
  if (!parsed.ok) throw data(null, { status: 404 });
  const code = parsed.value;
  const now = new Date();
  const database = context.get(databaseContext);
  const reader = requireUser(context, url);
  const prices = readPrices(context, now);
  const moment = { now, delayMinutes: prices.source.delayMinutes };
  const quote = prices.quotes.find(
    (candidate) => candidate.kind === "stock" && candidate.code === code,
  );
  const attempt = attemptForCodes(prices.latestAttempt, [code]);
  const history = listStockHistory(database, code);
  const selectedRange = parsePriceChartRange(
    url.searchParams.get("range"),
    "range",
  );
  const chartRange = selectedRange.ok ? selectedRange.value : "1y";
  const chartStart = priceChartStart(wibDateOf(now), chartRange);
  const rules = idxRulesOn(wibDateOf(now));
  const universe = universeOn(wibDateOf(now));
  const member =
    reader.role === "student"
      ? readStudentPortfolio(context, {
          request,
          url,
          classId: params.classId,
          now,
        })
      : undefined;
  const report =
    member === undefined
      ? undefined
      : readPortfolioValuation(database, {
          portfolio: member.portfolio,
          startingCash: member.place.owner.startingCash,
        });
  return {
    classId,
    task: readLessonTask(url),
    code,
    quote,
    quoteNotice:
      quote === undefined
        ? missingQuoteText(code, attempt, moment)
        : quoteFailureText(attempt, [quote], moment),
    history: {
      ...history,
      closes: history.closes.filter(
        (point) => point.date >= chartStart && point.date <= wibDateOf(now),
      ),
    },
    chartRange,
    range: stockPriceRange(history, wibDateOf(now)),
    measures: readStockMeasures(database, code),
    correlation:
      report === undefined
        ? undefined
        : readStockCorrelation(database, code, report.valuation),
    totalValue: report?.valuation.total?.value,
    isLq45: isLq45Stock(code, universe),
    holding: report?.valuation.holdings.find(
      (holding) => holding.code === code,
    ),
    portfolioNotice:
      report === undefined
        ? undefined
        : holdingQuoteFailureText([report], moment),
    lotShares: rules.ok ? rules.value.lotShares : undefined,
    canTrade: reader.role === "student",
  };
}

export default function StockPage({
  loaderData: stock,
}: Route.ComponentProps): ReactNode {
  const { classId, code, quote, holding } = stock;
  const ticket = useOutlet();
  const location = useLocation();
  const visibleTask = ticket === null ? stock.task : undefined;
  return (
    <TicketDraftMemory key={code}>
      <div
        className={ticket === null ? undefined : styles["withTicket"]}
        data-layout={ticket === null ? undefined : "columns"}
      >
        <div className={styles["page"]}>
          <LessonTaskBanner classId={classId} task={visibleTask} />
          <header className={styles["header"]}>
            <div className={styles["identity"]}>
              <Link
                to={withLessonTask(marketPath(classId), stock.task)}
                className={styles["back"]}
                aria-label={m.market_data_back_to_market_link()}
              >
                ‹
              </Link>
              <StockName code={code} heading />
            </div>
            <p className={styles["muted"]}>
              <StockMetadata
                code={code}
                held={holding !== undefined}
                isLq45={stock.isLq45}
              />
            </p>
            {quote?.kind === "stock" && (
              <div className={styles["quote"]}>
                <strong className={styles["price"]}>
                  <NumberText>{formatRupiah(quote.price)}</NumberText>
                </strong>
                <span className={styles["change"]}>
                  <ChangeText
                    colored
                    change={formatSignedRupiah(
                      rupiah(quote.price - quote.previousClose),
                    )}
                  />
                </span>
                <span className={styles["change"]}>
                  <ChangeText
                    colored
                    change={formatSignedPercent(quoteChange(quote))}
                  />
                </span>
              </div>
            )}
            <StockQuoteDetails
              classId={classId}
              quote={
                quote?.kind === "stock"
                  ? {
                      quotedAt: quote.quotedAt,
                      previousClose: quote.previousClose,
                    }
                  : undefined
              }
              hasPortfolioQuotes={hasStockPortfolioQuotes(stock)}
            />
            <QuoteNotice text={stock.quoteNotice} className={styles["muted"]} />
          </header>
          <section
            className={styles["panel"]}
            aria-label={m.market_data_price_chart_title({ code })}
          >
            <StockHistoryChart
              history={stock.history}
              path={`${location.pathname}${location.search}`}
              range={stock.chartRange}
            />
          </section>
          {holding !== undefined && (
            <section
              className={styles["panel"]}
              aria-labelledby="position-title"
            >
              <h2 id="position-title">{m.market_data_position_title()}</h2>
              <StockPosition
                holding={holding}
                lotShares={stock.lotShares}
                totalValue={stock.totalValue}
              />
            </section>
          )}
          <section
            className={styles["panel"]}
            aria-labelledby="statistics-title"
          >
            <div className={styles["statisticsHeader"]}>
              <h2 id="statistics-title">{m.market_data_statistics_title()}</h2>
              {stock.measures.ok && (
                <span className={styles["muted"]}>
                  <StockStatisticsWindow measures={stock.measures.value} />
                </span>
              )}
            </div>
            <StockKeyMeasures
              classId={classId}
              code={code}
              measures={stock.measures}
              correlation={stock.correlation}
            >
              <StockRange range={stock.range} />
            </StockKeyMeasures>
            <QuoteNotice
              text={stock.portfolioNotice}
              className={styles["muted"]}
            />
            <details className={styles["calculations"]}>
              <summary>{m.market_data_all_calculations_label()}</summary>
              <MethodNotice />
              <StockMeasuresView code={code} measures={stock.measures} />
            </details>
          </section>
          {stock.canTrade && (
            <nav
              className={styles["actions"]}
              hidden={ticket !== null}
              aria-label={m.market_data_trade_label()}
            >
              <Link
                data-stock-trade="buy"
                className={styles["buy"]}
                to={{
                  pathname: `${stockPath(classId, code)}/buy`,
                  search: location.search,
                }}
                preventScrollReset
              >
                {m.market_data_buy_link()}
              </Link>
              <Link
                data-stock-trade="sell"
                className={styles["sell"]}
                to={{
                  pathname: `${stockPath(classId, code)}/sell`,
                  search: location.search,
                }}
                preventScrollReset
              >
                {m.market_data_sell_link()}
              </Link>
            </nav>
          )}
        </div>
        {ticket}
      </div>
    </TicketDraftMemory>
  );
}

function hasStockPortfolioQuotes(stock: ReturnType<typeof loader>): boolean {
  return (
    (stock.holding?.kind === "priced" && stock.totalValue !== undefined) ||
    stock.correlation?.ok === true
  );
}
