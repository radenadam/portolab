import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { countedText } from "~/counted-text";
import definitionStyles from "~/definition-list.module.css";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatList,
  formatMarketTime,
  formatNumber,
  formatRupiah,
  formatSignedPercent,
  formatSignedRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { holdingQuoteFailureText } from "./holding-quote-failure-text";
import type { PortfolioReport } from "./read-portfolio-report.server";
import type { PortfolioValuation, ValuedHolding } from "./value-portfolio";
import { HoldingItems } from "./portfolio-summary";
import { missingCalendarText, ReturnSection } from "./return-section";
import { textForReader } from "./text-for-reader";
import type { PortfolioReader } from "./text-for-reader";
import styles from "./trading.module.css";

/** The value of a portfolio at delayed prices, its holdings, and its return against the IHSG at each final close, which the page of the portfolio shows below its title to its owner or to the lecturer of the class. */
export function PortfolioView({
  report,
  reader,
  now,
  source,
}: {
  report: PortfolioReport;
  reader: PortfolioReader;
  /** The moment that the page shows, which decides whether the next attempt of the quote job is still to come. */
  now: Date;
  source: PriceSourceDescription;
}): ReactNode {
  const { valuation } = report;
  const failure = holdingQuoteFailureText(report, {
    now,
    delayMinutes: source.delayMinutes,
  });
  const delay = {
    source: source.name,
    minutes: formatNumber(source.delayMinutes),
  };
  const index = marketIndex.code;
  return (
    <>
      <p>
        {textForReader(reader, {
          owner: () => m.trading_valuation_notice(delay),
          lecturer: (name) =>
            m.trading_lecturer_valuation_notice({ ...delay, name }),
        })}
      </p>
      {failure !== undefined && <p className={styles["details"]}>{failure}</p>}
      <h2>
        {textForReader(reader, {
          owner: () => m.trading_value_title(),
          lecturer: () => m.trading_lecturer_value_title(),
        })}
      </h2>
      <ValueSummary valuation={valuation} reader={reader} />
      <h2>
        {textForReader(reader, {
          owner: () => m.trading_holdings_title(),
          lecturer: () => m.trading_lecturer_holdings_title(),
        })}
      </h2>
      <HoldingValueList holdings={valuation.holdings} reader={reader} />
      <h2>
        {textForReader(reader, {
          owner: () => m.trading_return_title({ index }),
          lecturer: () => m.trading_lecturer_return_title({ index }),
        })}
      </h2>
      {report.history.ok ? (
        <ReturnSection
          points={report.history.value.points}
          end={report.history.value.end}
          reader={reader}
        />
      ) : (
        <p>{missingCalendarText(reader)}</p>
      )}
    </>
  );
}

function ValueSummary({
  valuation,
  reader,
}: {
  valuation: PortfolioValuation;
  reader: PortfolioReader;
}): ReactNode {
  const { total } = valuation;
  return (
    <>
      <dl className={definitionStyles["list"]}>
        <dt>{m.trading_cash_label()}</dt>
        <dd>{formatRupiah(valuation.cash)}</dd>
        {total !== undefined && (
          <>
            <dt>
              {textForReader(reader, {
                owner: () => m.trading_holdings_value_label(),
                lecturer: () => m.trading_lecturer_holdings_value_label(),
              })}
            </dt>
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
  reader,
}: {
  holdings: readonly ValuedHolding[];
  reader: PortfolioReader;
}): ReactNode {
  return (
    <HoldingItems
      holdings={holdings}
      emptyText={textForReader(reader, {
        owner: () => m.trading_no_holdings_body(),
        lecturer: (name) => m.trading_lecturer_no_holdings_body({ name }),
      })}
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
              <dl className={definitionStyles["list"]}>
                {cost}
                <HoldingValue holding={holding} />
              </dl>
            );
          case "unpriced":
            return (
              <>
                <dl className={definitionStyles["list"]}>{cost}</dl>
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
