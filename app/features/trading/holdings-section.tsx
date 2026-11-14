import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import tableStyles from "~/data-table.module.css";
import { StockName } from "~/features/market-data/stock-name";
import {
  formatMarketTime,
  formatNumber,
  formatRupiah,
  formatSignedPercent,
  formatSignedRupiah,
} from "~/formatting";
import { PhoneAndDesktop } from "~/frame";
import { m } from "~/paraglide/messages.js";
import { shareCount } from "./count-parts";
import { textForReader } from "./text-for-reader";
import type { PortfolioReader } from "./text-for-reader";
import styles from "./trading.module.css";
import type { ValuedHolding } from "./value-portfolio";

/** The holdings of a portfolio at their delayed prices, or the sentence that it holds no shares, which the page of the portfolio shows to its owner or to the lecturer of the class. */
export function HoldingsSection({
  holdings,
  reader,
}: {
  holdings: readonly ValuedHolding[];
  reader: PortfolioReader;
}): ReactNode {
  return (
    <section>
      <h2 id={holdingsHeadingId}>
        {textForReader(reader, {
          owner: () => m.trading_holdings_title(),
          lecturer: () => m.trading_lecturer_holdings_title(),
        })}
      </h2>
      {holdings.length === 0 ? (
        <p>
          {textForReader(reader, {
            owner: () => m.trading_no_holdings_body(),
            lecturer: (name) => m.trading_lecturer_no_holdings_body({ name }),
          })}
        </p>
      ) : (
        <HoldingValues holdings={holdings} />
      )}
    </section>
  );
}

// The table of holdings scrolls on its own when its widest amounts do not fit, so it is a region that its heading names.
const holdingsHeadingId = "holdings-heading";

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
      <th scope="row">
        <StockName code={holding.code} />
      </th>
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
        <StockName code={holding.code} />
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
