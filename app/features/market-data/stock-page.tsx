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
import { requireUser } from "~/features/accounts/current-session.server";
import { databaseContext } from "~/database/database.server";
import { requireReaderClass } from "~/features/classes/require-reader-class.server";
import { readStockMeasures } from "~/features/measures/read-measures.server";
import { StockStatisticsWindow } from "~/features/measures/stock-statistics-window";
import { StockKeyMeasures } from "~/features/measures/stock-key-measures";
import { StockMeasuresView } from "~/features/measures/stock-measures-view";
import { MethodNotice } from "~/features/measures/method-notice";
import { idxRulesOn } from "~/features/trading/idx-rules-on";
import { parseStockCode } from "~/features/trading/order-form-fields";
import { StockPosition } from "~/features/trading/stock-position";
import { TicketDraftMemory } from "~/features/trading/ticket-draft-memory";
import { hasStockPortfolioQuotes } from "./has-stock-portfolio-quotes";
import { readStockPortfolio } from "./read-stock-portfolio.server";
import { StockImpact } from "~/features/trading/stock-impact";
import { readImpactSelection } from "~/features/trading/read-impact-selection.server";
import { TradeImpactSelectionForm } from "~/features/trading/trade-impact-selection-form";
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
  const reader = requireUser(context, url);
  const parsed = parseStockCode(params.code, "code", trackedStockCodes);
  if (!parsed.ok) throw data(null, { status: 404 });
  const code = parsed.value;
  const now = new Date();
  const database = context.get(databaseContext);
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
  const portfolio = readStockPortfolio(context, {
    request,
    url,
    classId: params.classId,
    code,
    ...moment,
  });
  const selection = readImpactSelection(url);
  return data(
    {
      classId,
      task: readLessonTask(url),
      draftKey: `${String(reader.id)}:${stockPath(classId, code)}`,
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
      ...portfolio,
      selection,
      isLq45: isLq45Stock(code, universe),
      lotShares: rules.ok ? rules.value.lotShares : undefined,
    },
    { status: selection.fields === undefined ? 200 : 400 },
  );
}

export default function StockPage({
  loaderData: stock,
}: Route.ComponentProps): ReactNode {
  if (stock.selection.fields !== undefined) {
    return (
      <div className={styles["page"]}>
        <TradeImpactSelectionForm fields={stock.selection.fields} />
      </div>
    );
  }
  return <StockPageContent stock={stock} />;
}

function StockPageContent({
  stock,
}: {
  stock: Route.ComponentProps["loaderData"];
}): ReactNode {
  const { classId, code, quote, holding } = stock;
  const ticket = useOutlet();
  const location = useLocation();
  const visibleTask = ticket === null ? stock.task : undefined;
  return (
    <TicketDraftMemory key={stock.draftKey} storageKey={stock.draftKey}>
      <div
        className={ticket === null ? styles["page"] : styles["withTicket"]}
        data-layout={ticket === null ? "content" : "columns"}
      >
        <div className={styles["page"]}>
          <LessonTaskBanner classId={classId} task={visibleTask} />
          <header className={styles["header"]}>
            <div className={styles["identity"]}>
              <Link
                to={withLessonTask(stock.returnPath, stock.task)}
                className={styles["back"]}
                aria-label={stock.returnLabel}
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
              quote={quote?.kind === "stock" ? quote : undefined}
              portfolioQuotes={
                hasStockPortfolioQuotes(stock) ? stock.portfolioQuotes : []
              }
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
              returnTo={stock.returnTo}
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
              portfolioKind={stock.portfolioKind}
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
              <StockMeasuresView
                code={code}
                measures={stock.measures}
                portfolioKind={stock.portfolioKind}
              />
            </details>
          </section>
          <StockImpact
            portfolioKind={stock.portfolioKind}
            code={code}
            ticket={stock.tradePreview}
            {...stock.selection}
          />
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
        </div>
        {ticket}
      </div>
    </TicketDraftMemory>
  );
}
