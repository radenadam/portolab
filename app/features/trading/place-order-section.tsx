import type { ReactNode } from "react";
import { Form, Link } from "react-router";
import { ChangeText } from "~/change-text";
import definitionStyles from "~/definition-list.module.css";
import type { ClassId } from "~/features/classes/classes.schema";
import type { StockQuote } from "~/features/market-data/price-source.server";
import { quoteChange } from "~/features/market-data/quote-change";
import {
  missingQuoteText,
  quoteFailureText,
} from "~/features/market-data/quote-failure-text";
import { SelectField, SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import {
  formatMarketTime,
  formatRupiah,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import type { OrdersAnswer } from "./order-actions.server";
import { OrderForm } from "./order-form";
import type { OrderDay } from "./order-form";
import type { TradingDayFailure } from "./order-trading-day";
import { ordersPath } from "./orders-path";
import type { StockChoice } from "./read-stock-choice.server";
import styles from "./trading.module.css";

// The texts of a refused order speak of that order, but the page states the gap before the student places one.
const missingDayTexts: Record<TradingDayFailure["kind"], () => string> = {
  missingRules: () => m.trading_rules_missing_notice(),
  missingCosts: () => m.trading_costs_missing_notice(),
};

interface PlaceOrderSectionProps {
  /** The trading day of an order placed now, which orderTradingDay gives, or why Portolab cannot check an order against it. */
  day: Result<OrderDay, TradingDayFailure>;
  /** The stock that the address of the page chose, which readStockChoice reads. */
  choice: StockChoice;
  /** The codes of the stocks that the field that chooses a stock offers. */
  codes: readonly string[];
  classId: ClassId;
  /** The moment that the page shows and the delay of its prices, which decide when the quote job tries again. */
  moment: { now: Date; delayMinutes: number };
  /** The answer of the action to a form that it did not accept. */
  answer: OrdersAnswer | undefined;
}

/** The section for a new order: the form that chooses a stock, and then the latest delayed price of that stock with the order form, or why Portolab cannot take an order now when a record that its trading day needs is missing. */
export function PlaceOrderSection({
  day,
  choice,
  codes,
  classId,
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
        <Link to={ordersPath(classId)} className={styles["link"]}>
          {m.trading_other_stock_link()}
        </Link>
      );
      // Portolab refuses every order of a stock without a delayed price, so the order form waits for one.
      if (quote === undefined) {
        return (
          <>
            <dl className={definitionStyles["list"]}>
              <StockTerm code={code} />
            </dl>
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
          <dl className={definitionStyles["list"]}>
            <StockTerm code={code} />
            <QuoteTerms quote={quote} />
          </dl>
          {failure !== undefined && (
            <p className={styles["details"]}>{failure}</p>
          )}
          {otherStockLink}
          <OrderForm
            day={day.value}
            fields={answer?.fields}
            failure={answer?.failure}
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

function StockTerm({ code }: { code: string }): ReactNode {
  return (
    <>
      <dt>{m.trading_stock_label()}</dt>
      <dd>{code}</dd>
    </>
  );
}

function QuoteTerms({ quote }: { quote: StockQuote }): ReactNode {
  return (
    <>
      <dt>{m.trading_delayed_price_label()}</dt>
      <dd>{formatRupiah(quote.price)}</dd>
      <dt>{m.trading_change_label()}</dt>
      <dd>
        <ChangeText change={formatSignedPercent(quoteChange(quote))} />
      </dd>
      <dt>{m.trading_quoted_at_label()}</dt>
      <dd>{formatMarketTime(quote.quotedAt)}</dd>
    </>
  );
}
