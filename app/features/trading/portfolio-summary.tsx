import type { ReactNode } from "react";
import { countedText } from "~/counted-text";
import { formatRupiah } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { shareCount } from "./count-parts";
import type { Holding } from "./holding-after-fill";
import { cashSetAside, sharesSetAside } from "./open-orders";
import type { Order } from "./order";
import styles from "./trading.module.css";

interface PortfolioAtMoment {
  cash: Rupiah;
  holdings: readonly Holding[];
  orders: readonly Order[];
  now: Date;
}

/** The cash of a portfolio, what its open buy orders set aside at a moment, and the cash that is left for another order. */
export function CashSummary({
  cash,
  orders,
  now,
}: Omit<PortfolioAtMoment, "holdings">): ReactNode {
  const setAside = cashSetAside(orders, now).amount;
  return (
    <dl className={styles["summary"]}>
      <dt>{m.trading_cash_label()}</dt>
      <dd>{formatRupiah(cash)}</dd>
      <dt>{m.trading_set_aside_label()}</dt>
      <dd>{formatRupiah(setAside)}</dd>
      <dt>{m.trading_available_cash_label()}</dt>
      <dd>{formatRupiah(rupiah(cash - setAside))}</dd>
    </dl>
  );
}

/** The shares that a portfolio holds, what they cost, and how many of them its open sell orders set aside at a moment. */
export function HoldingList({
  holdings,
  orders,
  now,
}: Omit<PortfolioAtMoment, "cash">): ReactNode {
  if (holdings.length === 0) {
    return <p>{m.trading_no_holdings_body()}</p>;
  }
  return (
    <ul className={styles["list"]}>
      {holdings.map((holding) => {
        const setAside = sharesSetAside(orders, holding.code, now);
        return (
          <li key={holding.code} className={styles["item"]}>
            <p className={styles["title"]}>{holding.code}</p>
            <p className={styles["details"]}>
              {m.trading_holding_notice({
                shares: shareCount(holding.shares),
                cost: formatRupiah(holding.cost),
              })}
            </p>
            {setAside.orders > 0 && (
              <p className={styles["details"]}>
                {countedText(
                  setAside.orders,
                  {
                    one: m.trading_one_sale_sets_aside_notice,
                    several: m.trading_several_sales_set_aside_notice,
                  },
                  { shares: shareCount(setAside.amount) },
                )}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
