import { TradingLessonExplanation } from "./trading-lesson-explanation";
import { Link } from "react-router";
import { marketPath } from "~/features/market-data/market-path";
import { shareCount } from "~/features/trading/count-parts";
import {
  TradingOwnNumbers,
  TradingLessonPractice,
} from "./trading-lesson-practice";
import { useState } from "react";
import type { ReactNode } from "react";
import type { ClassId } from "~/features/classes/classes.schema";
import {
  acceptedPriceRange,
  tickOfPrice,
} from "~/features/trading/accepted-prices";
import { ticketPriceStep } from "~/features/trading/ticket-price-step";
import { lotAmounts } from "~/features/trading/lot-amounts";
import { orderFailureText } from "~/features/trading/order-failure-text";
import { formatLimit } from "~/features/trading/limit-price-failure-text";
import { TicketSchedule } from "~/features/trading/ticket-schedule";
import { formatNumber, formatRupiah } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { rupiah } from "~/units/rupiah";
import { smallestOrderLots } from "~/units/lots";
import type { SessionContent } from "./content";
import type { TradingLessonData } from "./trading-lesson-data";
import { LessonSlider } from "./lesson-slider";
import { PracticePanel } from "./practice-panel";
import { TickTable } from "./trading-rule-tables";
import { SessionTimeline } from "./session-timeline";
import styles from "./lesson-practice.module.css";

const examplePriceCeiling = rupiah(30_000);

export function LessonTrading({
  classId,
  lesson,
  trading,
  children,
  idPrefix = "",
  taskPage,
}: {
  classId: ClassId;
  lesson: SessionContent;
  trading: TradingLessonData;
  children: ReactNode;
  idPrefix?: string;
  taskPage?: string | undefined;
}): ReactNode {
  const [position, setPosition] = useState(62);
  const day = trading.day;
  const explanation = (
    <TradingLessonExplanation lesson={lesson} trading={trading} />
  );
  const timeline = <TradingSessionCard trading={trading} />;
  const ownNumbers = <TradingOwnNumbers trading={trading} />;
  if (day?.ok !== true)
    return (
      <>
        {timeline}
        <section
          className={styles["interactive"]}
          aria-labelledby={`${idPrefix}lesson-interactive-title`}
        >
          <h2>
            <span id={`${idPrefix}lesson-interactive-title`}>
              {m.learning_try_price_title()}
            </span>
            {explanation}
          </h2>
          <p>
            {day === undefined
              ? m.learning_trading_data_notice()
              : orderFailureText(day.failure, trading.portfolioKind)}
          </p>
        </section>
        {ownNumbers}
        {children}
        <PracticePanel idPrefix={idPrefix}>
          <Link className={styles["button"]} to={marketPath(classId)}>
            {m.learning_read_stock_link()}
          </Link>
        </PracticePanel>
      </>
    );
  const { rules } = day.value;
  const price = rupiah(
    Math.max(
      rules.minimumPrice,
      Math.round(
        rules.minimumPrice *
          (examplePriceCeiling / rules.minimumPrice) ** (position / 100),
      ),
    ),
  );
  const reference = rupiah(
    Math.floor(price / tickOfPrice(price, rules.tickBands)) *
      tickOfPrice(price, rules.tickBands),
  );
  const band = acceptedPriceRange(reference, rules);
  const amounts = lotAmounts(reference, day.value);
  const { buy, sell } = amounts;
  const quantity = amounts.shares;
  return (
    <>
      {timeline}
      <section
        className={styles["interactive"]}
        aria-labelledby={`${idPrefix}lesson-interactive-title`}
      >
        <h2>
          <span id={`${idPrefix}lesson-interactive-title`}>
            {m.learning_try_price_title()}
          </span>
          {explanation}
        </h2>
        <LessonSlider
          id={`${idPrefix}lesson-price`}
          kind="price"
          label={m.learning_reference_price_label()}
          text={formatRupiah(reference)}
          value={position}
          maximum={100}
          step={1}
          onChange={setPosition}
        />
        <dl className={styles["statistics"]}>
          {[
            [
              m.learning_tick_label(),
              formatRupiah(tickOfPrice(reference, rules.tickBands)),
              m.learning_next_price_label({
                value: formatRupiah(ticketPriceStep(reference, 1, rules)),
              }),
            ],
            [
              m.learning_ara_limit_label({
                limit: formatLimit(band.upper, "upper"),
              }),
              formatRupiah(band.highest),
              m.learning_upper_limit_label(),
            ],
            [
              m.learning_arb_limit_label({
                limit: formatLimit(band.lower, "lower"),
              }),
              formatRupiah(band.lowest),
              m.learning_lower_limit_label(),
            ],
            [
              m.learning_lot_value_label({
                lots: formatNumber(smallestOrderLots),
              }),
              formatRupiah(buy.value),
              shareCount(quantity),
            ],
            [
              m.learning_buy_lot_label({
                lots: formatNumber(smallestOrderLots),
              }),
              formatRupiah(buy.total),
              m.learning_fee_amount_label({ fee: formatRupiah(buy.fee) }),
            ],
            [
              m.learning_sell_lot_label({
                lots: formatNumber(smallestOrderLots),
              }),
              formatRupiah(sell.total),
              m.learning_sale_cost_label({
                fee: formatRupiah(sell.fee),
                tax: formatRupiah(sell.tax),
              }),
            ],
          ].map(([label, value, detail]) => (
            <div key={label}>
              <dt>
                <NumberText>{label}</NumberText>
              </dt>
              <dd>
                <NumberText whole>{value}</NumberText>
                <small className={styles["comparison"]}>
                  <NumberText>{detail}</NumberText>
                </small>
              </dd>
            </div>
          ))}
        </dl>
        <TickTable rules={rules} highlight={reference} />
      </section>
      {ownNumbers}
      {children}
      <TradingLessonPractice
        classId={classId}
        trading={trading}
        date={day.value.date}
        idPrefix={idPrefix}
        taskPage={taskPage}
      />
    </>
  );
}

function TradingSessionCard({
  trading,
}: {
  trading: TradingLessonData;
}): ReactNode {
  if (!trading.hours.ok) return null;
  const day = trading.day;
  return (
    <section className={styles["interactive"]}>
      <h2>{m.learning_trading_hours_title()}</h2>
      <SessionTimeline
        hours={trading.hours.value}
        date={day?.ok === true ? day.value.date : trading.date}
      />
      {day?.ok === true && (
        <p>
          <TicketSchedule
            tradesFrom={day.value.tradesFrom}
            expiresAt={day.value.expiresAt}
          />
        </p>
      )}
    </section>
  );
}
