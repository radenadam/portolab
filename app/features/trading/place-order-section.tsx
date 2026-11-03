import type { ReactNode } from "react";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import { OrderForm } from "./order-form";
import type { OrderDay } from "./order-form";
import type { OrderFormFields } from "./order-form-fields";
import type { TradingDayFailure } from "./order-trading-day";

// The texts of a refused order speak of that order, but the page states the gap before the student places one.
const missingDayTexts: Record<TradingDayFailure["kind"], () => string> = {
  missingRules: () => m.trading_rules_missing_notice(),
  missingCosts: () => m.trading_costs_missing_notice(),
};

interface PlaceOrderSectionProps {
  /** The trading day of an order placed now, which orderTradingDay gives, or why Portolab cannot check an order against it. */
  day: Result<OrderDay, TradingDayFailure>;
  codes: readonly string[];
  fields: OrderFormFields | undefined;
  failure: string | undefined;
}

/** The order form for an order placed now, or why Portolab cannot take an order now when a record that its trading day needs is missing. */
export function PlaceOrderSection({
  day,
  codes,
  fields,
  failure,
}: PlaceOrderSectionProps): ReactNode {
  if (!day.ok) {
    return <p>{missingDayTexts[day.failure.kind]()}</p>;
  }
  return (
    <OrderForm
      codes={codes}
      day={day.value}
      fields={fields}
      failure={failure}
    />
  );
}
