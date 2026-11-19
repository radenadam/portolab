import styles from "./stock-page.module.css";
import { StockHeader } from "./stock-header";
import { readLessonTask } from "~/features/learning/read-lesson-task.server";
import { isLq45Stock } from "./is-lq45-stock";
import { LessonTaskBanner } from "~/features/learning/lesson-task-banner";
import type { ReactNode } from "react";
import { data, Link, useOutlet, useLocation } from "react-router";
import { requireUser } from "~/features/accounts/current-session.server";
import { databaseContext } from "~/database/database.server";
import { requireReaderClass } from "~/features/classes/require-reader-class.server";
import { readStockMeasures } from "~/features/measures/read-measures.server";
import { idxRulesOn } from "~/features/trading/idx-rules-on";
import { parseStockCode } from "~/features/trading/order-form-fields";
import { StockPosition } from "~/features/trading/stock-position";
import { TicketDraftMemory } from "~/features/trading/ticket-draft-memory";
import { readStockPortfolio } from "./read-stock-portfolio.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { wibDateOf } from "~/wib";
import type { Route } from "./+types/stock-page";
import { listStockHistory } from "./history-store.server";
import { readPrices } from "./read-prices.server";
import {
  attemptForCodes,
  missingQuoteText,
  quoteFailureText,
} from "./quote-failure-text";
import { stockPath } from "./stock-path";
import { StockHistoryChart } from "./stock-history-chart";
import { StockStatistics } from "./stock-statistics";
import { readStockDayRange } from "./read-stock-day-range.server";
import { readStockYearRange } from "./read-stock-year-range.server";
import { stockPriceRange } from "./stock-price-range";
import { parsePriceChartRange, priceChartStart } from "./price-chart-range";
import { trackedStockCodes, universeOn } from "./tracked-instruments";
import { watchedCodes } from "~/features/watchlist/watchlist-store.server";

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
  const watched = watchedCodes(database, reader.id).includes(code);
  const portfolio = readStockPortfolio(context, {
    request,
    url,
    classId: params.classId,
    code,
    watched,
    ...moment,
  });
  return data({
    classId,
    task: readLessonTask(url),
    draftKey: `${String(reader.id)}:${stockPath(classId, code)}`,
    code,
    watched,
    quote,
    dayRangeText: readStockDayRange(
      code,
      quote?.kind === "stock" ? quote : undefined,
      now,
    ),
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
    range: readStockYearRange(stockPriceRange(history, wibDateOf(now))),
    measures: readStockMeasures(database, code),
    ...portfolio,
    isLq45: isLq45Stock(code, universe),
    lotShares: rules.ok ? rules.value.lotShares : undefined,
  });
}

export default function StockPage({
  loaderData: stock,
}: Route.ComponentProps): ReactNode {
  return <StockPageContent stock={stock} />;
}

function StockPageContent({
  stock,
}: {
  stock: Route.ComponentProps["loaderData"];
}): ReactNode {
  const { classId, code, holding } = stock;
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
          <StockHeader
            stock={stock}
            returnTo={`${location.pathname}${location.search}${location.hash}`}
            trade={
              <nav
                className={styles["actions"]}
                hidden={ticket !== null}
                aria-label={m.market_data_trade_label()}
              >
                <Link
                  data-stock-trade="buy"
                  className={styles["buy"]}
                  to={{
                    pathname: stockPath(classId, code, "buy"),
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
                    pathname: stockPath(classId, code, "sell"),
                    search: location.search,
                  }}
                  preventScrollReset
                >
                  {m.market_data_sell_link()}
                </Link>
              </nav>
            }
          />
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
          <StockStatistics stock={stock} />
        </div>
        {ticket}
      </div>
    </TicketDraftMemory>
  );
}
