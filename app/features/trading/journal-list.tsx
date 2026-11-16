import { MarketTime } from "~/market-time";
import { NumberText } from "~/number-text";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { countedText } from "~/counted-text";
import { percentOf } from "~/charts/plot";
import { plotFraction } from "~/units/plot-fraction";
import type { ClassId } from "~/features/classes/classes.schema";
import { StockName } from "~/features/market-data/stock-name";
import { StockPageLink } from "~/features/market-data/stock-page-link";
import {
  attemptForCodes,
  missingQuoteText,
  quoteFailureText,
} from "~/features/market-data/quote-failure-text";
import type { PricesOfView } from "~/features/market-data/read-prices.server";
import {
  formatNumber,
  formatRupiah,
  formatSignedPercent,
  formatSignedRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { lotCount } from "./count-parts";
import { journalEntryId } from "./journal-entry-id";
import type { JournalTrade } from "./trade-journal";
import type { OrderSide } from "./order";
import { SideTag } from "./activity-orders";
import styles from "./activity.module.css";

type JournalPrices = Pick<PricesOfView, "now" | "source" | "latestAttempt">;

const sinceLabels: Record<OrderSide, () => string> = {
  buy: m.trading_activity_since_buy_label,
  sell: m.trading_activity_since_sell_label,
};

export function JournalList({
  trades,
  prices,
  classId,
  readOnly,
}: {
  trades: readonly JournalTrade[];
  prices: JournalPrices;
  classId: ClassId;
  readOnly: boolean;
}): ReactNode {
  const maximum = cumulativeReturn(
    Math.max(0.01, ...trades.map((trade) => Math.abs(trade.change ?? 0))),
  );
  return (
    <section
      className={styles["journalSection"]}
      aria-labelledby="journal-heading"
    >
      <h2 id="journal-heading" className={styles["journalTitle"]}>
        {m.trading_activity_journal_title()}{" "}
        <span>
          <NumberText whole>
            {countedText(
              trades.length,
              {
                one: m.trading_activity_one_trade_label,
                several: m.trading_activity_several_trades_label,
              },
              { count: formatNumber(trades.length) },
            )}
          </NumberText>
        </span>
      </h2>
      <div className={styles["panel"]}>
        {trades.length === 0 ? (
          <p className={styles["empty"]}>
            {m.trading_activity_no_trades_body()}
          </p>
        ) : (
          <ul className={styles["list"]} data-layout="rows">
            {trades.map((trade) => (
              <li className={styles["journalRow"]} key={trade.order.id}>
                <div className={styles["journalHeader"]}>
                  <SideTag side={trade.order.side} />
                  <StockPageLink
                    classId={classId}
                    code={trade.order.code}
                    id={journalEntryId(trade.order.id)}
                    keepReturn={readOnly}
                    className={styles["stock"]}
                  >
                    <StockName
                      code={trade.order.code}
                      withCompanyName={false}
                      smallTile
                    />
                  </StockPageLink>
                  <span className={styles["tradePrice"]}>
                    <NumberText>{lotCount(trade.order.lots)}</NumberText> ·{" "}
                    <NumberText>{formatRupiah(trade.fill.price)}</NumberText>
                  </span>
                  <small>
                    <MarketTime moment={trade.fill.quotedAt} />
                  </small>
                </div>
                {trade.order.reason === undefined ? (
                  <p className={styles["reason"]}>
                    {m.trading_activity_no_reason_body()}
                  </p>
                ) : (
                  <blockquote>
                    <NumberText verbatim>{trade.order.reason}</NumberText>
                  </blockquote>
                )}
                <JournalPerformance
                  trade={trade}
                  prices={prices}
                  maximum={maximum}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function JournalPerformance({
  trade,
  prices,
  maximum,
}: {
  trade: JournalTrade;
  prices: JournalPrices;
  maximum: CumulativeReturn;
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
      {comparison !== undefined && (
        <small>
          <MarketTime moment={comparison.quote.quotedAt} />
        </small>
      )}
      {notice !== undefined && (
        <small>
          <NumberText>{notice}</NumberText>
        </small>
      )}
    </div>
  );
}
