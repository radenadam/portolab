import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { countedText } from "~/counted-text";
import tableStyles from "~/data-table.module.css";
import { latestQuoteTime } from "~/features/market-data/latest-quote-time";
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
import { PhoneAndDesktop } from "~/frame";
import { m } from "~/paraglide/messages.js";
import { shareCount } from "./count-parts";
import { holdingQuoteFailureText } from "./holding-quote-failure-text";
import type { PortfolioReport } from "./read-portfolio-report.server";
import type { ValuedHolding } from "./value-portfolio";
import { ReturnSection } from "./return-section";
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
  return (
    <>
      <Headline report={report} reader={reader} now={now} source={source} />
      <ReturnSection history={report.history} reader={reader} />
      <section>
        <h2 id={holdingsHeadingId}>
          {textForReader(reader, {
            owner: () => m.trading_holdings_title(),
            lecturer: () => m.trading_lecturer_holdings_title(),
          })}
        </h2>
        {report.valuation.holdings.length === 0 ? (
          <p>
            {textForReader(reader, {
              owner: () => m.trading_no_holdings_body(),
              lecturer: (name) => m.trading_lecturer_no_holdings_body({ name }),
            })}
          </p>
        ) : (
          <HoldingValues holdings={report.valuation.holdings} />
        )}
      </section>
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

// The table of holdings scrolls on its own when its widest amounts do not fit, so it is a region that its heading names.
const holdingsHeadingId = "holdings-heading";

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

/** The holdings at their delayed prices: a table on a desktop, and a list of rows on a phone, as decision 0026 sets. */
function HoldingValues({
  holdings,
}: {
  holdings: readonly ValuedHolding[];
}): ReactNode {
  return (
    <PhoneAndDesktop
      phone={
        <ul className={styles["rows"]}>
          {holdings.map((holding) => (
            <HoldingRow key={holding.code} holding={holding} />
          ))}
        </ul>
      }
      desktop={
        // The widest amounts that Portolab accepts can be wider than the main column, so the table then scrolls on its own, and axe asks that a keyboard can reach a part that scrolls.
        <div
          role="region"
          aria-labelledby={holdingsHeadingId}
          // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex -- the region scrolls, so it needs a stop of the keyboard.
          tabIndex={0}
          className={styles["tableFrame"]}
        >
          <table className={tableStyles["table"]}>
            <thead>
              <tr>
                <th scope="col">{m.trading_stock_label()}</th>
                <th scope="col">{m.trading_shares_label()}</th>
                <th scope="col">{m.trading_cost_label()}</th>
                <th scope="col">
                  <span className={styles["cellLine"]}>
                    {m.trading_delayed_price_label()}
                  </span>
                  <span className={styles["cellLine"]}>
                    {m.trading_quoted_at_label()}
                  </span>
                </th>
                <th scope="col">{m.trading_value_label()}</th>
                <th scope="col">
                  <span className={styles["cellLine"]}>
                    {m.trading_gain_label()}
                  </span>
                  <span className={styles["cellLine"]}>
                    {m.trading_gain_return_label()}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => (
                <HoldingTableRow key={holding.code} holding={holding} />
              ))}
            </tbody>
          </table>
        </div>
      }
    />
  );
}

function HoldingTableRow({ holding }: { holding: ValuedHolding }): ReactNode {
  return (
    <tr>
      <th scope="row">{holding.code}</th>
      <td className={tableStyles["number"]}>{formatNumber(holding.shares)}</td>
      <td className={tableStyles["number"]}>{formatRupiah(holding.cost)}</td>
      {holding.kind === "priced" ? (
        <>
          <td className={tableStyles["number"]}>
            <span className={styles["cellLine"]}>
              {formatRupiah(holding.quote.price)}
            </span>
            <span className={styles["cellDetail"]}>
              {formatMarketTime(holding.quote.quotedAt)}
            </span>
          </td>
          <td className={tableStyles["number"]}>
            {formatRupiah(holding.value)}
          </td>
          <td className={tableStyles["number"]}>
            <span className={styles["cellLine"]}>
              <ChangeText change={formatSignedRupiah(holding.gain)} />
            </span>
            <span className={styles["cellLine"]}>
              <ChangeText change={formatSignedPercent(holding.gainReturn)} />
            </span>
          </td>
        </>
      ) : (
        <td colSpan={3} className={styles["details"]}>
          {m.trading_unpriced_notice({ code: holding.code })}
        </td>
      )}
    </tr>
  );
}

function HoldingRow({ holding }: { holding: ValuedHolding }): ReactNode {
  return (
    <li className={styles["row"]}>
      <div className={styles["rowName"]}>
        <p className={styles["title"]}>{holding.code}</p>
        <p className={styles["details"]}>
          {m.trading_holding_notice({
            shares: shareCount(holding.shares),
            cost: formatRupiah(holding.cost),
          })}
        </p>
        <p className={styles["details"]}>
          {holding.kind === "priced"
            ? m.trading_holding_price_notice({
                price: formatRupiah(holding.quote.price),
                time: formatMarketTime(holding.quote.quotedAt),
              })
            : m.trading_unpriced_notice({ code: holding.code })}
        </p>
      </div>
      {holding.kind === "priced" && (
        <div className={styles["rowNumbers"]}>
          <p>{formatRupiah(holding.value)}</p>
          <p>
            <ChangeText change={formatSignedRupiah(holding.gain)} />
          </p>
          <p>
            <ChangeText change={formatSignedPercent(holding.gainReturn)} />
          </p>
        </div>
      )}
    </li>
  );
}
