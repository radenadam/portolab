import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { countedText } from "~/counted-text";
import tableStyles from "~/data-table.module.css";
import type {
  PriceSourceDescription,
  StockQuote,
} from "~/features/market-data/price-source.server";
import { quoteFailureText } from "~/features/market-data/quote-failure-text";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatCalendarDate,
  formatList,
  formatMarketClock,
  formatMarketTime,
  formatNumber,
  formatRupiah,
  formatSignedPercent,
  formatSignedRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { HistoryEnd, ReturnPoint } from "./portfolio-history";
import type { PortfolioReport } from "./read-portfolio-report.server";
import type { PortfolioValuation, ValuedHolding } from "./value-portfolio";
import { HoldingItems } from "./portfolio-summary";
import { ReturnChart } from "./return-chart";
import styles from "./trading.module.css";

// The license of Lightweight Charts asks every page that shows a chart for the attribution notice of its NOTICE file and a link to TradingView. The notice names the library and its owner, so it reads the same in every language.
const chartNotice = "TradingView Lightweight Charts™ © 2025 TradingView, Inc.";
const chartNoticeAddress = "https://www.tradingview.com/";

/** The value of a portfolio at delayed prices, its holdings, and its return against the IHSG at each final close, which the page of the portfolio shows below its title. */
export function PortfolioView({
  report,
  now,
  source,
}: {
  report: PortfolioReport;
  /** The moment that the page shows, which decides whether the next attempt of the quote job is still to come. */
  now: Date;
  source: PriceSourceDescription;
}): ReactNode {
  const { valuation } = report;
  const failure = quoteFailureText(
    report.quoteAttempt,
    pricedQuotes(valuation.holdings),
    { now, delayMinutes: source.delayMinutes },
  );
  return (
    <>
      <p>
        {m.trading_valuation_notice({
          source: source.name,
          minutes: formatNumber(source.delayMinutes),
        })}
      </p>
      {failure !== undefined && <p className={styles["details"]}>{failure}</p>}
      <h2>{m.trading_value_title()}</h2>
      <ValueSummary valuation={valuation} />
      <h2>{m.trading_holdings_title()}</h2>
      <HoldingValueList holdings={valuation.holdings} />
      <h2>{m.trading_return_title({ index: marketIndex.code })}</h2>
      {report.history.ok ? (
        <ReturnSection
          points={report.history.value.points}
          end={report.history.value.end}
        />
      ) : (
        <p>{m.trading_chart_calendar_missing_notice()}</p>
      )}
    </>
  );
}

function pricedQuotes(holdings: readonly ValuedHolding[]): StockQuote[] {
  const quotes: StockQuote[] = [];
  for (const holding of holdings) {
    if (holding.kind === "priced") {
      quotes.push(holding.quote);
    }
  }
  return quotes;
}

function ValueSummary({
  valuation,
}: {
  valuation: PortfolioValuation;
}): ReactNode {
  const { total } = valuation;
  return (
    <>
      <dl className={styles["summary"]}>
        <dt>{m.trading_cash_label()}</dt>
        <dd>{formatRupiah(valuation.cash)}</dd>
        {total !== undefined && (
          <>
            <dt>{m.trading_holdings_value_label()}</dt>
            <dd>{formatRupiah(total.holdingsValue)}</dd>
            <dt>{m.trading_total_value_label()}</dt>
            <dd>{formatRupiah(total.value)}</dd>
          </>
        )}
        <dt>{m.trading_starting_cash_label()}</dt>
        <dd>{formatRupiah(valuation.startingCash)}</dd>
        {total !== undefined && (
          <>
            <dt>{m.trading_return_label()}</dt>
            <dd>
              <ChangeText change={formatSignedPercent(total.return)} />
            </dd>
          </>
        )}
      </dl>
      {total === undefined && (
        <p>
          {countedText(
            valuation.unpricedCodes.length,
            {
              one: m.trading_one_unpriced_holding_notice,
              several: m.trading_several_unpriced_holdings_notice,
            },
            { codes: formatList(valuation.unpricedCodes, "conjunction") },
          )}
        </p>
      )}
    </>
  );
}

function HoldingValueList({
  holdings,
}: {
  holdings: readonly ValuedHolding[];
}): ReactNode {
  return (
    <HoldingItems
      holdings={holdings}
      details={(holding) => {
        const cost = (
          <>
            <dt>{m.trading_shares_label()}</dt>
            <dd>{formatNumber(holding.shares)}</dd>
            <dt>{m.trading_cost_label()}</dt>
            <dd>{formatRupiah(holding.cost)}</dd>
          </>
        );
        switch (holding.kind) {
          case "priced":
            return (
              <dl className={styles["summary"]}>
                {cost}
                <HoldingValue holding={holding} />
              </dl>
            );
          case "unpriced":
            return (
              <>
                <dl className={styles["summary"]}>{cost}</dl>
                <p className={styles["details"]}>
                  {m.trading_unpriced_notice({ code: holding.code })}
                </p>
              </>
            );
        }
      }}
    />
  );
}

function HoldingValue({
  holding,
}: {
  holding: Extract<ValuedHolding, { kind: "priced" }>;
}): ReactNode {
  return (
    <>
      <dt>{m.trading_delayed_price_label()}</dt>
      <dd>{formatRupiah(holding.quote.price)}</dd>
      <dt>{m.trading_quoted_at_label()}</dt>
      <dd>{formatMarketTime(holding.quote.quotedAt)}</dd>
      <dt>{m.trading_value_label()}</dt>
      <dd>{formatRupiah(holding.value)}</dd>
      <dt>{m.trading_gain_label()}</dt>
      <dd>
        <ChangeText change={formatSignedRupiah(holding.gain)} />
      </dd>
      <dt>{m.trading_gain_return_label()}</dt>
      <dd>
        <ChangeText change={formatSignedPercent(holding.gainReturn)} />
      </dd>
    </>
  );
}

function ReturnSection({
  points,
  end,
}: {
  points: readonly ReturnPoint[];
  end: HistoryEnd;
}): ReactNode {
  const start = points[0];
  return (
    <>
      {start !== undefined && (
        <>
          <p>
            {m.trading_chart_notice({
              index: marketIndex.code,
              date: formatCalendarDate(start.date),
            })}
          </p>
          {/* The legend names the lines of the chart, which screen readers skip, as they do the chart. */}
          <ul className={styles["legend"]} aria-hidden>
            <li className={styles["portfolioSeries"]}>
              {m.trading_portfolio_series_label()}
            </li>
            <li className={styles["marketSeries"]}>{marketIndex.code}</li>
          </ul>
          <ReturnChart points={points} />
          <details className={styles["returns"]}>
            <summary className={styles["returnsLabel"]}>
              {m.trading_returns_table_label()}
            </summary>
            <ReturnTable points={points} />
          </details>
        </>
      )}
      <p className={styles["details"]}>{historyEndText(end)}</p>
      {start !== undefined && (
        <p className={styles["details"]}>
          <a href={chartNoticeAddress} className={styles["link"]}>
            {m.trading_chart_credit_link({ notice: chartNotice })}
          </a>
        </p>
      )}
    </>
  );
}

function ReturnTable({
  points,
}: {
  points: readonly ReturnPoint[];
}): ReactNode {
  return (
    <table className={tableStyles["table"]}>
      <thead>
        <tr>
          <th scope="col">{m.trading_trading_day_label()}</th>
          <th scope="col">{m.trading_portfolio_series_label()}</th>
          <th scope="col">{marketIndex.code}</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.date}>
            <th scope="row">{formatCalendarDate(point.date, "medium")}</th>
            <td className={tableStyles["number"]}>
              <ChangeText change={formatSignedPercent(point.portfolio)} />
            </td>
            <td className={tableStyles["number"]}>
              <ChangeText change={formatSignedPercent(point.market)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function historyEndText(end: HistoryEnd): string {
  switch (end.kind) {
    case "notFinal":
      return m.trading_chart_not_final_notice({
        date: formatCalendarDate(end.date),
        time: formatMarketClock(end.finalAt),
      });
    case "missingCloses":
      return countedText(
        end.codes.length,
        {
          one: m.trading_one_missing_close_notice,
          several: m.trading_several_missing_closes_notice,
        },
        {
          codes: formatList(end.codes, "conjunction"),
          date: formatCalendarDate(end.date),
        },
      );
    case "missingCalendar":
      return m.trading_chart_calendar_missing_notice();
  }
}
