import styles from "./home-portfolio.module.css";
import type { ReactNode } from "react";
import { priceChange } from "~/features/market-data/price-change";
import {
  formatMarketTime,
  formatRupiah,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { ChangeText } from "~/change-text";
import type { ValuedHolding } from "./value-portfolio";

export function HomeHoldingPrice({
  holding,
  failed,
}: {
  holding: ValuedHolding;
  failed: boolean;
}): ReactNode {
  return (
    <>
      {holding.kind === "priced" ? (
        <>
          <span>{formatRupiah(holding.quote.price)}</span>
          <small>
            <ChangeText
              colored
              change={formatSignedPercent(
                priceChange(holding.quote.price, holding.quote.previousClose),
              )}
            />
          </small>
          <small className={styles["quoteTime"]}>
            {m.trading_home_price_time_notice({
              time: formatMarketTime(holding.quote.quotedAt),
            })}
          </small>
          {failed && <small>{m.trading_home_quote_failed_notice()}</small>}
        </>
      ) : (
        m.trading_unpriced_notice({ code: holding.code })
      )}
    </>
  );
}
