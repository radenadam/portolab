import { NumberText } from "~/number-text";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { percentOf } from "~/charts/plot";
import { plotFraction } from "~/units/plot-fraction";
import {
  attemptForCodes,
  missingQuoteText,
  quoteFailureText,
} from "~/features/market-data/quote-failure-text";
import type { PricesOfView } from "~/features/market-data/read-prices.server";
import {
  ownQuoteTime,
  sharedQuoteTime,
} from "~/features/market-data/shared-quote-time";
import { QuoteTime } from "~/features/market-data/quote-time";
import {
  formatRupiah,
  formatSignedPercent,
  formatSignedRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { JournalTrade } from "./trade-journal";
import type { OrderSide } from "./order";
import styles from "./activity.module.css";

type JournalPrices = Pick<PricesOfView, "now" | "source" | "latestAttempt">;

const sinceLabels: Record<OrderSide, () => string> = {
  buy: m.trading_activity_since_buy_label,
  sell: m.trading_activity_since_sell_label,
};

/** The scale of the bars of the changes since the trades, shared by every filled order of a list, and the time that the current prices of the list share, which the list states once, so only a price of another time shows its own. */
export function tradePerformanceScale(trades: readonly JournalTrade[]): {
  maximum: CumulativeReturn;
  sharedTime: Date | undefined;
} {
  return {
    maximum: cumulativeReturn(
      Math.max(0.01, ...trades.map((trade) => Math.abs(trade.change ?? 0))),
    ),
    sharedTime: sharedQuoteTime(
      trades.map((trade) =>
        trade.change === undefined ? undefined : trade.quote,
      ),
    ),
  };
}

/** How a filled order has done since it filled: the change of its price since then and, for a sale, the realised gain from the average purchase cost. */
export function TradePerformance({
  trade,
  prices,
  maximum,
  sharedTime,
}: {
  trade: JournalTrade;
  prices: JournalPrices;
  maximum: CumulativeReturn;
  /** The time that the current prices of the journal share, which its note states once, so only a price of another time shows its own. */
  sharedTime: Date | undefined;
}): ReactNode {
  const attempt = attemptForCodes(prices.latestAttempt, [trade.order.code]);
  const moment = { now: prices.now, delayMinutes: prices.source.delayMinutes };
  const notice =
    trade.quote === undefined
      ? missingQuoteText(trade.order.code, attempt, moment)
      : quoteFailureText(attempt, [trade.quote], moment);
  const comparison =
    trade.quote === undefined || trade.change === undefined
      ? undefined
      : { quote: trade.quote, change: trade.change };
  return (
    <div className={styles["performance"]}>
      <div className={styles["comparison"]} data-side={trade.order.side}>
        {trade.order.side === "sell" && (
          <p>
            {m.trading_activity_realized_label()}{" "}
            {trade.realized === undefined ? (
              <NumberText>{m.trading_activity_no_cost_notice()}</NumberText>
            ) : (
              <ChangeText colored change={formatSignedRupiah(trade.realized)} />
            )}
          </p>
        )}
        {comparison === undefined ? (
          <p>
            <NumberText>
              {m.trading_activity_no_change_notice({ code: trade.order.code })}
            </NumberText>
          </p>
        ) : (
          <div className={styles["since"]} data-side={trade.order.side}>
            <span>{sinceLabels[trade.order.side]()}</span>
            <span>
              <ChangeText
                colored
                change={formatSignedPercent(comparison.change)}
              />
            </span>
            {trade.order.side === "buy" && (
              <span className={styles["currentPrice"]}>
                <NumberText>{formatRupiah(comparison.quote.price)}</NumberText>
              </span>
            )}
            {trade.order.side === "buy" && (
              <span className={styles["bar"]} aria-hidden="true">
                <span
                  data-change={formatSignedPercent(comparison.change).direction}
                  style={{
                    left: percentOf(
                      plotFraction(
                        comparison.change < 0
                          ? 0.5 - Math.abs(comparison.change) / maximum / 2
                          : 0.5,
                      ),
                    ),
                    width: percentOf(
                      plotFraction(Math.abs(comparison.change) / maximum / 2),
                    ),
                  }}
                />
              </span>
            )}
          </div>
        )}
      </div>
      <OwnQuoteTime comparison={comparison} sharedTime={sharedTime} />
      {notice !== undefined && (
        <small>
          <NumberText>{notice}</NumberText>
        </small>
      )}
    </div>
  );
}

function OwnQuoteTime({
  comparison,
  sharedTime,
}: {
  comparison: { quote: { quotedAt: Date } } | undefined;
  sharedTime: Date | undefined;
}): ReactNode {
  if (
    comparison === undefined ||
    ownQuoteTime(comparison.quote.quotedAt, sharedTime) === undefined
  )
    return null;
  return (
    <small>
      <QuoteTime quotedAt={comparison.quote.quotedAt} sharedTime={sharedTime} />
    </small>
  );
}
