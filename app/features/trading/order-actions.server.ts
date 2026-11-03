import { data, redirect } from "react-router";
import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { priceSourceContext } from "~/features/market-data/price-source-context.server";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import { formatMarketTime } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail } from "~/result";
import { parseRecordId } from "~/value-parsers";
import { cancelPortfolioOrder } from "./cancel-portfolio-order.server";
import type { CancelFailure } from "./cancel-portfolio-order.server";
import { lotCount } from "./count-parts";
import type { StudentPlace } from "./find-student-place.server";
import type { OrderFailure } from "./order";
import { limitPriceFailureText, orderFailureText } from "./order-failure-text";
import { readOrderForm, typedOrderForm } from "./order-form-fields";
import type { OrderFormFields } from "./order-form-fields";
import { orderTradingDay } from "./order-trading-day";
import { ordersPath } from "./orders-path";
import { placePortfolioOrder } from "./place-portfolio-order.server";
import type { OrderId } from "./trading.schema";

/** The answer of the action of the orders to a form that it did not accept: the order form as the student sent it with the reason for each field, why the order was not accepted as a whole, and why no order was cancelled. */
export interface OrdersAnswer {
  fields: OrderFormFields | undefined;
  failure: string | undefined;
  cancelFailure: string | undefined;
}

/** A form that a student sent to the orders of a class at a moment. */
export interface OrdersForm {
  form: FormData;
  place: Pick<StudentPlace, "classId" | "owner">;
  now: Date;
}

// A failure that the order causes is a wrong value. A record or a price that Portolab lacks keeps it from taking any such order for now.
const failureStatuses: Record<OrderFailure["kind"], number> = {
  missingRules: 503,
  missingCosts: 503,
  missingUniverse: 503,
  noPrice: 503,
  noPriceHistory: 503,
  noReferenceClose: 503,
  outsideUniverse: 400,
  tooFewReturns: 400,
  outsideLimits: 400,
  offTick: 400,
  notEnoughCash: 400,
  notEnoughShares: 400,
};

/** Places the order of the form and opens the orders with the notice that Portolab accepted it, or answers with the reason that the form or the order was not accepted. */
export function placeFromForm(
  context: Readonly<RouterContextProvider>,
  { form, place, now }: OrdersForm,
): Response | ReturnType<typeof data<OrdersAnswer>> {
  const { delayMinutes } = context.get(priceSourceContext);
  const day = orderTradingDay(now, delayMinutes);
  if (!day.ok) {
    return answer(
      { fields: typedOrderForm(form), failure: orderFailureText(day.failure) },
      failureStatuses[day.failure.kind],
    );
  }
  const request = readOrderForm(form, {
    codes: trackedStockCodes,
    maximumLots: day.value.rules.maximumLots,
    placedAt: now,
  });
  if (!request.ok) {
    return answer({ fields: request.failure }, 400);
  }
  const placed = placePortfolioOrder(
    context.get(databaseContext),
    request.value,
    { owner: place.owner, delayMinutes },
  );
  if (placed.ok) {
    return redirect(
      `${ordersPath(place.classId)}?placed=${String(placed.value)}`,
    );
  }
  const { failure } = placed;
  const fields = typedOrderForm(form);
  const status = failureStatuses[failure.kind];
  // A failure of the limit price concerns the value of its field, and every other failure concerns the order as a whole, which orderFailureText explains.
  if (failure.kind === "outsideLimits" || failure.kind === "offTick") {
    return answer(
      {
        fields: {
          ...fields,
          limitFailure: limitPriceFailureText(failure, {
            label: m.trading_limit_price_label(),
            written: fields.limit.trim(),
          }),
        },
      },
      status,
    );
  }
  return answer({ fields, failure: orderFailureText(failure) }, status);
}

/** Cancels the order that the form names and opens the orders again, or answers with the reason that no order was cancelled. A number that names no order of the student, which only a forged form or a deletion by hand leads to, is a missing order. */
export function cancelFromForm(
  context: Readonly<RouterContextProvider>,
  { form, place, now }: OrdersForm,
): Response | ReturnType<typeof data<OrdersAnswer>> {
  const orderId = parseRecordId<OrderId>(form.get("cancel"), "cancel");
  const cancelled = orderId.ok
    ? cancelPortfolioOrder(
        context.get(databaseContext),
        { membershipId: place.owner.membershipId, orderId: orderId.value },
        now,
      )
    : fail<CancelFailure>({ kind: "missing" });
  if (cancelled.ok) {
    return redirect(ordersPath(place.classId));
  }
  switch (cancelled.failure.kind) {
    case "missing":
      return answer({ cancelFailure: m.trading_missing_order_error() }, 404);
    case "ended": {
      const { order } = cancelled.failure;
      return answer(
        {
          cancelFailure: m.trading_order_ended_error({
            lots: lotCount(order.lots),
            code: order.code,
            time: formatMarketTime(order.placedAt),
          }),
        },
        409,
      );
    }
  }
}

function answer(
  parts: Partial<OrdersAnswer>,
  status: number,
): ReturnType<typeof data<OrdersAnswer>> {
  return data<OrdersAnswer>(
    {
      fields: parts.fields,
      failure: parts.failure,
      cancelFailure: parts.cancelFailure,
    },
    { status },
  );
}
