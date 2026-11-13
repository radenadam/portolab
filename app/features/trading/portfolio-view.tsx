import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { countedText } from "~/counted-text";
import { latestQuoteTime } from "~/features/market-data/latest-quote-time";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatList,
  formatNumber,
  formatRupiah,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { holdingQuoteFailureText } from "./holding-quote-failure-text";
import { HoldingsSection } from "./holdings-section";
import type { PortfolioReport } from "./read-portfolio-report.server";
import { missingCalendarText, ReturnSection } from "./return-section";
import { textForReader } from "./text-for-reader";
import type { PortfolioReader } from "./text-for-reader";
import styles from "./trading.module.css";

/** The value of a portfolio at delayed prices as its headline, its return against the IHSG at each final close, and its holdings, which the page of the portfolio shows to its owner or to the lecturer of the class. */
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
  const index = marketIndex.code;
  return (
    <>
      <Headline report={report} reader={reader} now={now} source={source} />
      <section>
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
      </section>
      <HoldingsSection holdings={report.valuation.holdings} reader={reader} />
    </>
  );
}

/** When the newest of the delayed prices that the page of a portfolio shows was quoted, which its header line shows, or undefined for a page without prices. */
export function portfolioPricesTime(report: PortfolioReport): Date | undefined {
  const quotes: { quotedAt: Date }[] = [];
  if (report.market !== undefined) {
    quotes.push(report.market.quote);
  }
  for (const holding of report.valuation.holdings) {
    if (holding.kind === "priced") {
      quotes.push(holding.quote);
    }
  }
  return latestQuoteTime(quotes);
}

/** The value of a portfolio as the headline of its page, with the values that explain it in the line under it, as decision 0026 sets. */
function Headline({
  report,
  reader,
  now,
  source,
}: {
  report: PortfolioReport;
  reader: PortfolioReader;
  now: Date;
  source: PriceSourceDescription;
}): ReactNode {
  const { valuation, market } = report;
  const { total } = valuation;
  const failure = holdingQuoteFailureText([report], {
    now,
    delayMinutes: source.delayMinutes,
  });
  const delay = {
    source: source.name,
    minutes: formatNumber(source.delayMinutes),
  };
  return (
    <section>
      <h2>
        {textForReader(reader, {
          owner: () => m.trading_value_title(),
          lecturer: () => m.trading_lecturer_value_title(),
        })}
      </h2>
      {total === undefined ? (
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
      ) : (
        <p className={styles["headline"]}>{formatRupiah(total.value)}</p>
      )}
      <dl className={styles["facts"]}>
        {total !== undefined && (
          <div className={styles["fact"]}>
            <dt>{m.trading_return_label()}</dt>
            <dd>
              <ChangeText change={formatSignedPercent(total.return)} />
            </dd>
          </div>
        )}
        {market !== undefined && (
          <div className={styles["fact"]}>
            <dt>
              {m.trading_market_return_label({ index: marketIndex.code })}
            </dt>
            <dd>
              <ChangeText change={formatSignedPercent(market.return)} />
            </dd>
          </div>
        )}
        <div className={styles["fact"]}>
          <dt>{m.trading_cash_label()}</dt>
          <dd>{formatRupiah(valuation.cash)}</dd>
        </div>
        <div className={styles["fact"]}>
          <dt>{m.trading_starting_cash_label()}</dt>
          <dd>{formatRupiah(valuation.startingCash)}</dd>
        </div>
      </dl>
      <p className={styles["details"]}>
        {textForReader(reader, {
          owner: () => m.trading_valuation_notice(delay),
          lecturer: (name) =>
            m.trading_lecturer_valuation_notice({ ...delay, name }),
        })}
      </p>
      {failure !== undefined && <p className={styles["details"]}>{failure}</p>}
    </section>
  );
}
