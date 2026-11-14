import type { ReactNode } from "react";
import { Form } from "react-router";
import {
  ChoiceField,
  Rejection,
  StepForm,
  SubmitButton,
  TextAreaField,
  TextField,
} from "~/form";
import formStyles from "~/form.module.css";
import {
  formatCalendarDate,
  formatMarketClock,
  formatNumber,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { smallestOrderLots } from "~/units/lots";
import type { Lots } from "~/units/lots";
import type { Shares } from "~/units/shares";
import { lotCount, shareCount } from "./count-parts";
import type { OrderRejection } from "./order-actions.server";
import {
  blankOrderForm,
  lotsStepName,
  priceKindOptions,
  sideOptions,
} from "./order-form-fields";
import type { OrderFormFields } from "./order-form-fields";
import type { OrderSide } from "./order";
import type { OrderTradingDay } from "./order-trading-day";
import { reasonMaximumLength } from "./reason-maximum-length";

/** What the order form tells about the trading day of an order placed now, which orderTradingDay gives. */
export interface OrderDay {
  date: string;
  tradesFrom: Date;
  expiresAt: Date;
  lotShares: Shares;
  maximumLots: Lots;
}

/** What the order form tells about a trading day that orderTradingDay gives. */
export function orderDayOf(day: OrderTradingDay): OrderDay {
  return {
    date: day.date,
    tradesFrom: day.tradesFrom,
    expiresAt: day.expiresAt,
    lotShares: day.rules.lotShares,
    maximumLots: day.rules.maximumLots,
  };
}

interface OrderFormProps {
  day: OrderDay;
  initialSide?: OrderSide | undefined;
  /** What the student sent, with the reason that each field was not accepted. */
  fields: OrderFormFields | undefined;
  /** Why Portolab did not accept the order as a whole, with the lots that its next step offers. */
  rejection: OrderRejection | undefined;
}

/** The form with which a student places an order of the stock that the address of the page chose: buy or sell, a market or a limit order, the lots, the limit price, and the reason that the student may write, with the trading day of an order placed now. A rejection of the whole order stands above the fields, as decision 0026 sets, with a button that changes the lots of the rejected order to those that its text offers. The form sends the order to the address of the page, which keeps the stock. */
export function OrderForm({
  day,
  initialSide,
  fields: givenFields,
  rejection,
}: OrderFormProps): ReactNode {
  const fields = givenFields ?? {
    ...blankOrderForm,
    side: initialSide ?? blankOrderForm.side,
  };
  return (
    <>
      {rejection !== undefined && (
        <Rejection
          title={m.trading_rejected_title()}
          text={rejection.text}
          step={
            rejection.lotsStep !== undefined && (
              <StepForm
                fields={{
                  side: fields.side,
                  priceKind: fields.priceKind,
                  limit: fields.limit,
                  reason: fields.reason,
                }}
                step={{
                  name: lotsStepName,
                  value: formatNumber(rejection.lotsStep),
                }}
                label={m.trading_lots_step_label({
                  lots: lotCount(rejection.lotsStep),
                })}
              />
            )
          }
        />
      )}
      <OrderFields day={day} fields={fields} />
    </>
  );
}

/** The fields of an order and the button that sends them, which is the only submit button of their form, so Enter in a field sends the order. */
function OrderFields({
  day,
  fields,
}: {
  day: OrderDay;
  fields: OrderFormFields;
}): ReactNode {
  return (
    <Form method="post" className={formStyles["form"]}>
      <ChoiceField
        name="side"
        label={m.trading_side_label()}
        options={sideOptions()}
        failure={fields.sideFailure}
        defaultValue={fields.side}
      />
      <ChoiceField
        name="priceKind"
        label={m.trading_price_kind_label()}
        options={priceKindOptions()}
        failure={fields.priceKindFailure}
        defaultValue={fields.priceKind}
      />
      <TextField
        // The step of a rejection changes the lots that the form shows, and a field keeps its own value until it is drawn anew.
        key={fields.lots}
        name="lots"
        label={m.trading_lots_label()}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        hint={m.trading_lots_hint({
          shares: shareCount(day.lotShares),
          smallest: lotCount(smallestOrderLots),
          largest: lotCount(day.maximumLots),
        })}
        failure={fields.lotsFailure}
        defaultValue={fields.lots}
      />
      <TextField
        name="limit"
        label={m.trading_limit_price_label()}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        hint={m.trading_limit_price_hint()}
        failure={fields.limitFailure}
        defaultValue={fields.limit}
      />
      <TextAreaField
        name="reason"
        label={m.trading_reason_label()}
        hint={m.trading_reason_hint({
          maximum: formatNumber(reasonMaximumLength),
        })}
        failure={fields.reasonFailure}
        defaultValue={fields.reason}
      />
      <p className={formStyles["hint"]}>
        {m.trading_day_notice({
          date: formatCalendarDate(day.date),
          start: formatMarketClock(day.tradesFrom),
          end: formatMarketClock(day.expiresAt),
        })}
      </p>
      <SubmitButton label={m.trading_place_label()} />
    </Form>
  );
}
