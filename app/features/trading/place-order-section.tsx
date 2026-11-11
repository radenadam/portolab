import type { ReactNode } from "react";
import { Form, Link } from "react-router";
import { ChangeText } from "~/change-text";
import type { StockQuote } from "~/features/market-data/price-source.server";
import { quoteChange } from "~/features/market-data/quote-change";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import {
  missingQuoteText,
  quoteFailureText,
} from "~/features/market-data/quote-failure-text";
import { SelectField, SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import {
  formatMarketTime,
  formatNumber,
  formatRupiah,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { OrdersAnswer } from "./order-actions.server";
import type { OrderTicket } from "./order-ticket.server";
import { OrderForm } from "./order-form";
import type { TradingDayFailure } from "./order-trading-day";
import styles from "./trading.module.css";

// The texts of a refused order speak of that order, but the page states the gap before the student places one.
const missingDayTexts: Record<TradingDayFailure["kind"], () => string> = {
  missingRules: () => m.trading_rules_missing_notice(),
  missingCosts: () => m.trading_costs_missing_notice(),
};

interface PlaceOrderSectionProps {
  /** The trading day of an order placed now and the stock that the address of the page chose, which readOrderTicket reads. */
  ticket: OrderTicket;
  /** The codes of the stocks that the field that chooses a stock offers, which are those that Portolab tracks unless a test gives others. */
  codes?: readonly string[];
  /** The address of the page that shows the ticket, without a stock, to which the link that chooses another stock leads. */
  pagePath: string;
  /** The moment that the page shows and the delay of its prices, which decide when the quote job tries again. */
  moment: { now: Date; delayMinutes: number };
  /** The answer of the action to a form that it did not accept. */
  answer: OrdersAnswer | undefined;
}

/** The order ticket, as decision 0026 draws it: the form that chooses a stock, and then the latest delayed price of that stock with the order form, or why Portolab cannot take an order now when a record that its trading day needs is missing. The notice of the simulation in full ends it. */
export function PlaceOrderSection(props: PlaceOrderSectionProps): ReactNode {
  return (
    <section className={styles["ticket"]}>
      <h2>{m.trading_place_title()}</h2>
      <TicketBody {...props} />
      <p className={styles["details"]}>{m.trading_simulation_notice()}</p>
    </section>
  );
}

function TicketBody({
  ticket: { day, choice },
  codes = trackedStockCodes,
  pagePath,
  moment,
  answer,
}: PlaceOrderSectionProps): ReactNode {
  if (!day.ok) {
    return <p>{missingDayTexts[day.failure.kind]()}</p>;
  }
  switch (choice.kind) {
    case "choosing":
      return (
        <StockChooser
          codes={codes}
          failure={answer?.stockFailure ?? choice.failure}
        />
      );
    case "chosen": {
      const { code, quote, quoteAttempt } = choice;
      const otherStockLink = (
        <Link to={pagePath} className={styles["link"]}>
          {m.trading_other_stock_link()}
        </Link>
      );
      // Portolab refuses every order of a stock without a delayed price, so the order form waits for one.
      if (quote === undefined) {
        return (
          <>
            <p className={styles["ticketStock"]}>{code}</p>
            <p className={styles["details"]}>
              {missingQuoteText(code, quoteAttempt, moment)}
            </p>
            <p>{m.trading_no_price_order_notice({ code })}</p>
            {otherStockLink}
          </>
        );
      }
      const failure = quoteFailureText(quoteAttempt, [quote], moment);
      return (
        <>
          <p className={styles["ticketStock"]}>{code}</p>
          <QuoteLines quote={quote} delayMinutes={moment.delayMinutes} />
          {failure !== undefined && (
            <p className={styles["details"]}>{failure}</p>
          )}
          {otherStockLink}
          <OrderForm
            day={day.value}
            fields={answer?.fields}
            rejection={answer?.rejection}
          />
        </>
      );
    }
  }
}

/** The form that chooses the stock of a new order. It sends its field in the address, so the page shows the price of the stock with the order form before JavaScript loads, and the stock stays after a refused order. */
function StockChooser({
  codes,
  failure,
}: {
  codes: readonly string[];
  failure: string | undefined;
}): ReactNode {
  return (
    <Form method="get" className={formStyles["form"]}>
      <SelectField
        name="code"
        label={m.trading_stock_label()}
        placeholder={m.trading_choose_stock_label()}
        options={codes.map((code) => ({ value: code, label: code }))}
        hint={m.trading_stock_hint()}
        failure={failure}
      />
      <SubmitButton label={m.trading_show_price_label()} />
    </Form>
  );
}

/** The latest delayed price of the stock of the ticket with its change from the previous close, and its delay and the time of its quote under it. The names of the price and of the change are for screen readers, because the ticket shows the two numbers alone, as the references do. */
function QuoteLines({
  quote,
  delayMinutes,
}: {
  quote: StockQuote;
  delayMinutes: number;
}): ReactNode {
  return (
    <>
      <dl className={styles["ticketQuote"]}>
        <dt className={styles["visuallyHidden"]}>
          {m.trading_delayed_price_label()}
        </dt>
        <dd className={styles["ticketPrice"]}>{formatRupiah(quote.price)}</dd>
        <dt className={styles["visuallyHidden"]}>{m.trading_change_label()}</dt>
        <dd>
          <ChangeText change={formatSignedPercent(quoteChange(quote))} />
        </dd>
      </dl>
      <p className={styles["details"]}>
        {m.trading_quote_notice({
          minutes: formatNumber(delayMinutes),
          time: formatMarketTime(quote.quotedAt),
        })}
      </p>
    </>
  );
}
