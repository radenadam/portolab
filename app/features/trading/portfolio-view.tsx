import { QuoteNotice } from "~/features/market-data/quote-notice";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { countedText } from "~/counted-text";
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
import { ReturnSection } from "./return-section";
import { textForReader } from "./text-for-reader";
import type { PortfolioReader } from "./text-for-reader";
import styles from "./trading.module.css";

/** A shared report keeps an owner's view and a lecturer's view consistent. */
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
  return (
    <>
      <Headline report={report} reader={reader} now={now} source={source} />
      <ReturnSection history={report.history} reader={reader} />
      <HoldingsSection holdings={report.valuation.holdings} reader={reader} />
    </>
  );
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
        <NumberText>
          {textForReader(reader, {
            owner: () => m.trading_value_title(),
            lecturer: () => m.trading_lecturer_value_title(),
          })}
        </NumberText>
      </h2>
      {total === undefined ? (
        <p>
          <NumberText>
            {countedText(
              valuation.unpricedCodes.length,
              {
                one: m.trading_one_unpriced_holding_notice,
                several: m.trading_several_unpriced_holdings_notice,
              },
              { codes: formatList(valuation.unpricedCodes, "conjunction") },
            )}
          </NumberText>
        </p>
      ) : (
        <p className={styles["headline"]}>
          <NumberText>{formatRupiah(total.value)}</NumberText>
        </p>
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
              <NumberText>
                {m.trading_market_return_label({ index: marketIndex.code })}
              </NumberText>
            </dt>
            <dd>
              <ChangeText change={formatSignedPercent(market.return)} />
            </dd>
          </div>
        )}
        <div className={styles["fact"]}>
          <dt>{m.trading_cash_label()}</dt>
          <dd>
            <NumberText>{formatRupiah(valuation.cash)}</NumberText>
          </dd>
        </div>
        <div className={styles["fact"]}>
          <dt>{m.trading_starting_cash_label()}</dt>
          <dd>
            <NumberText>{formatRupiah(valuation.startingCash)}</NumberText>
          </dd>
        </div>
      </dl>
      <p className={styles["details"]}>
        <NumberText>
          {(textValue) =>
            textForReader(reader, {
              owner: () => m.trading_valuation_notice(delay),
              lecturer: (name) =>
                m.trading_lecturer_valuation_notice({
                  ...delay,
                  name: textValue(name),
                }),
            })
          }
        </NumberText>
      </p>
      <QuoteNotice text={failure} className={styles["details"]} />
    </section>
  );
}
