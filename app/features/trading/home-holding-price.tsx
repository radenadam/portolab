import styles from "./home-portfolio.module.css";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { priceChange } from "~/features/market-data/price-change";
import { ownQuoteTime } from "~/features/market-data/shared-quote-time";
import { formatNumber, formatSignedPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { ChangeText } from "~/change-text";
import type { ValuedHolding } from "./value-portfolio";

export function HomeHoldingPrice({
  holding,
  failed,
  sharedTime,
}: {
  holding: ValuedHolding;
  failed: boolean;
  sharedTime: Date | undefined;
}): ReactNode {
  const time =
    holding.kind === "priced"
      ? ownQuoteTime(holding.quote.quotedAt, sharedTime)
      : undefined;
  return (
    <>
      {holding.kind === "priced" ? (
        <>
          <span>
            <NumberText>{formatNumber(holding.quote.price)}</NumberText>
          </span>
          <small>
            <ChangeText
              colored
              change={formatSignedPercent(
                priceChange(holding.quote.price, holding.quote.previousClose),
              )}
            />
          </small>
          {time !== undefined && (
            <small className={styles["quoteTime"]}>
              <NumberText whole>{time}</NumberText>
            </small>
          )}
          {failed && <small>{m.trading_home_quote_failed_notice()}</small>}
        </>
      ) : (
        m.trading_unpriced_notice({ code: holding.code })
      )}
    </>
  );
}
