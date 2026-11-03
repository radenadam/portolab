import type { ReactNode } from "react";
import { Form } from "react-router";
import {
  ChoiceField,
  FormFailure,
  SelectField,
  SubmitButton,
  TextField,
} from "~/form";
import formStyles from "~/form.module.css";
import { formatCalendarDate, formatMarketClock } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { smallestOrderLots } from "~/units/lots";
import type { Lots } from "~/units/lots";
import type { Shares } from "~/units/shares";
import { lotCount, shareCount } from "./count-parts";
import {
  blankOrderForm,
  priceKindOptions,
  sideOptions,
} from "./order-form-fields";
import type { OrderFormFields } from "./order-form-fields";
import type { OrderTradingDay } from "./order-trading-day";

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
  /** The codes of the stocks that the form offers. */
  codes: readonly string[];
  day: OrderDay;
  /** What the student sent, with the reason that each field was not accepted. */
  fields: OrderFormFields | undefined;
  /** Why Portolab did not accept the order as a whole. */
  failure: string | undefined;
}

/** The form with which a student places an order: the stock, buy or sell, a market or a limit order, the lots, and the limit price, with the trading day of an order placed now. */
export function OrderForm({
  codes,
  day,
  fields = blankOrderForm,
  failure,
}: OrderFormProps): ReactNode {
  return (
    <Form method="post" className={formStyles["form"]}>
      <p>
        {m.trading_day_notice({
          date: formatCalendarDate(day.date),
          start: formatMarketClock(day.tradesFrom),
          end: formatMarketClock(day.expiresAt),
        })}
      </p>
      {failure !== undefined && <FormFailure text={failure} />}
      <SelectField
        name="code"
        label={m.trading_stock_label()}
        placeholder={m.trading_choose_stock_label()}
        options={codes.map((code) => ({ value: code, label: code }))}
        hint={m.trading_stock_hint()}
        failure={fields.codeFailure}
        defaultValue={fields.code}
      />
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
      <SubmitButton label={m.trading_place_label()} />
    </Form>
  );
}
