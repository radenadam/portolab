import { shareCount } from "~/features/trading/count-parts";
import type { ReactNode } from "react";
import { StockName } from "~/features/market-data/stock-name";
import { quoteChange } from "~/features/market-data/quote-change";
import { ChangeText } from "~/change-text";
import { ConceptHelp } from "~/concept-card";
import { tickOfPrice } from "~/features/trading/accepted-prices";
import { lotAmounts } from "~/features/trading/lot-amounts";
import { NumberText } from "~/number-text";
import {
  formatMarketTime,
  formatNumber,
  formatPercent,
  formatRupiah,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { smallestOrderLots } from "~/units/lots";
import { basisPointsPerWhole } from "~/units/basis-points";
import { TickTable } from "./trading-rule-tables";
import type { TradingLessonData } from "./trading-lesson-data";
import practiceStyles from "./lesson-practice.module.css";
import localStyles from "./price-guide.module.css";

export function PriceGuideMark({ number }: { number: number }): ReactNode {
  return (
    <span className={localStyles["mark"]} aria-hidden="true">
      {formatNumber(number)}
    </span>
  );
}

export function PriceGuideExample({
  trading,
}: {
  trading: TradingLessonData;
}): ReactNode {
  const quote = trading.quote;
  return (
    <>
      {quote === undefined ? (
        <p>{m.learning_trading_data_notice()}</p>
      ) : (
        <div className={localStyles["priceRow"]}>
          <StockName
            code={quote.code}
            codeDetail={<PriceGuideMark number={1} />}
          />
          <div className={localStyles["priceColumn"]}>
            <strong>
              <PriceGuideMark number={2} />{" "}
              <NumberText whole>{formatRupiah(quote.price)}</NumberText>
            </strong>
            <span>
              <PriceGuideMark number={3} />{" "}
              <ChangeText
                colored
                change={formatSignedPercent(quoteChange(quote))}
              />
            </span>
            <span>
              <PriceGuideMark number={4} />{" "}
              <NumberText whole>{formatMarketTime(quote.quotedAt)}</NumberText>
            </span>
          </div>
        </div>
      )}
      {trading.quoteNotice !== undefined && (
        <p>
          <NumberText>{trading.quoteNotice}</NumberText>
        </p>
      )}
    </>
  );
}
export function PriceGuideCost({
  trading,
}: {
  trading: TradingLessonData;
}): ReactNode {
  const quote = trading.quote;
  if (quote === undefined) return null;
  const day = trading.day;
  const amounts =
    day?.ok === true ? lotAmounts(quote.price, day.value) : undefined;
  const quantity = amounts?.shares;
  const amount = amounts?.buy;
  return (
    <section className={practiceStyles["interactive"]}>
      <h2>{m.learning_lot_cost_title()}</h2>
      {amount !== undefined && quantity !== undefined && day?.ok === true ? (
        <>
          <p>
            <NumberText>
              {m.learning_guide_lot_notice({
                lots: formatNumber(smallestOrderLots),
                shares: shareCount(quantity),
                code: quote.code,
                price: formatRupiah(quote.price),
                value: formatRupiah(amount.value),
                fee: formatRupiah(amount.fee),
                rate: formatPercent(
                  day.value.rates.buyFee / basisPointsPerWhole,
                  "two",
                ),
                total: formatRupiah(amount.total),
              })}
            </NumberText>
          </p>
          <div>
            <span>
              <NumberText>
                {m.learning_guide_tick_notice({
                  code: quote.code,
                  tick: formatRupiah(
                    tickOfPrice(quote.price, day.value.rules.tickBands),
                  ),
                })}
              </NumberText>
            </span>
            <ConceptHelp title={m.learning_tick_label()}>
              <TickTable rules={day.value.rules} highlight={quote.price} />
            </ConceptHelp>
          </div>
        </>
      ) : (
        <p>{m.learning_trading_data_notice()}</p>
      )}
    </section>
  );
}
