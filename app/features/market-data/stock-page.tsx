import type { ReactNode } from "react";
import { data, Link } from "react-router";
import { ChangeText } from "~/change-text";
import { databaseContext } from "~/database/database.server";
import { requireUser } from "~/features/accounts/current-session.server";
import { requireReaderClass } from "~/features/classes/require-reader-class.server";
import { readStockMeasures } from "~/features/measures/read-measures.server";
import { readStockCorrelation } from "~/features/measures/read-stock-correlation.server";
import { StockKeyMeasures } from "~/features/measures/stock-key-measures";
import { StockMeasuresView } from "~/features/measures/stock-measures-view";
import { MethodNotice } from "~/features/measures/method-notice";
import { readStudentPortfolio } from "~/features/trading/read-student-portfolio.server";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import { holdingQuoteFailureText } from "~/features/trading/holding-quote-failure-text";
import { idxRulesOn } from "~/features/trading/idx-rules-on";
import { parseStockCode } from "~/features/trading/order-form-fields";
import { StockPosition } from "~/features/trading/stock-position";
import {
  formatMarketTime,
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
import { stockReturnDestination } from "./stock-return-destination.server";
import { readPrices } from "./read-prices.server";
import {
  attemptForCodes,
  missingQuoteText,
  quoteFailureText,
} from "./quote-failure-text";
import { quoteChange } from "./quote-change";
import { StockName } from "./stock-name";
import { stockPath } from "./stock-path";
import styles from "./stock-page.module.css";
import { StockHistoryChart } from "./stock-history-chart";
import { StockRange } from "./stock-range";
import { stockPriceRange } from "./stock-price-range";
import { parsePriceChartRange, priceChartStart } from "./price-chart-range";
import { trackedStockCodes } from "./tracked-instruments";

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
    ...stockReturnDestination({ classId, role: reader.role, url, request }),
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
  return (
    <div className={styles["page"]}>
      <header className={styles["header"]}>
        <div className={styles["identity"]}>
          <Link
            to={stock.returnPath}
            className={styles["back"]}
            aria-label={stock.returnLabel}
          >
            ‹
          </Link>
          <StockName code={code} withSector heading />
        </div>
        {holding !== undefined && (
          <p className={styles["muted"]}>{m.market_data_held_notice()}</p>
        )}
        {quote?.kind === "stock" && (
          <>
            <div className={styles["quote"]}>
              <strong className={styles["price"]}>
                {formatRupiah(quote.price)}
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
            <p className={styles["muted"]}>
              {m.market_data_stock_quote_notice({
                time: formatMarketTime(quote.quotedAt),
                previous: formatRupiah(quote.previousClose),
              })}
            </p>
          </>
        )}
        {stock.quoteNotice !== undefined && (
          <p className={styles["muted"]}>{stock.quoteNotice}</p>
        )}
      </header>
      <section
        className={styles["panel"]}
        aria-label={m.market_data_price_chart_title({ code })}
      >
        <StockHistoryChart
          history={stock.history}
          path={stockPath(classId, code)}
          range={stock.chartRange}
          returnTo={stock.returnTo}
        />
      </section>
      {holding !== undefined && (
        <section className={styles["panel"]} aria-labelledby="position-title">
          <h2 id="position-title">{m.market_data_position_title()}</h2>
          <StockPosition holding={holding} lotShares={stock.lotShares} />
        </section>
      )}
      <section className={styles["panel"]} aria-labelledby="statistics-title">
        <h2 id="statistics-title">{m.market_data_statistics_title()}</h2>
        <StockKeyMeasures
          classId={classId}
          code={code}
          measures={stock.measures}
          correlation={stock.correlation}
        >
          <StockRange range={stock.range} />
        </StockKeyMeasures>
        {stock.portfolioNotice !== undefined && (
          <p className={styles["muted"]}>{stock.portfolioNotice}</p>
        )}
        <details className={styles["calculations"]}>
          <summary>{m.market_data_all_calculations_label()}</summary>
          <MethodNotice />
          <StockMeasuresView code={code} measures={stock.measures} />
        </details>
      </section>
      {stock.canTrade && (
        <nav
          className={styles["actions"]}
          aria-label={m.market_data_trade_label()}
        >
          <Link
            className={styles["buy"]}
            to={`${stockPath(classId, code)}/buy`}
          >
            {m.market_data_buy_link()}
          </Link>
          <Link
            className={styles["sell"]}
            to={`${stockPath(classId, code)}/sell`}
          >
            {m.market_data_sell_link()}
          </Link>
        </nav>
      )}
    </div>
  );
}
