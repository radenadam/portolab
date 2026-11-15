import type { PortfolioKind } from "./portfolio-store.server";
import { data, redirect } from "react-router";
import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readPriceSourceDescription } from "~/features/market-data/price-source-context.server";
import { formatMarketTime } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail } from "~/result";
import type { Lots } from "~/units/lots";
import type { Rupiah } from "~/units/rupiah";
import { parseRecordId } from "~/value-parsers";
import { cancelPortfolioOrder } from "./cancel-portfolio-order.server";
import type { CancelFailure } from "./cancel-portfolio-order.server";
import { lotCount } from "./count-parts";
import type { TradingPlace } from "./find-trading-place.server";
import type { OrderFailure, OrderRequest, OrderSide } from "./order";
import { lotsStepOf } from "./lots-step";
import { limitPriceFailureText } from "./limit-price-failure-text";
import { orderFailureText } from "./order-failure-text";
import { readOrderForm, typedOrderForm } from "./order-form-fields";
import type { OrderFormFields } from "./order-form-fields";
import { orderTradingDay } from "./order-trading-day";
import { activityPath } from "./activity-path";
import { placePortfolioOrder } from "./place-portfolio-order.server";
import type { OrderId } from "./trading.schema";
import { pathWithQuery } from "~/path-with-query";
import { parseSeenTotal } from "./parse-seen-total";

/** Why Portolab did not accept an order as a whole, with the lots of an order that it would accept in place of it, which the rejection offers as its next step, or undefined when no number of lots would do. */
export interface OrderRejection {
  text: string;
  lotsStep: Lots | undefined;
  field?: "lots";
}

/** Refused forms keep typed values so a correction does not erase the reason. */
export interface OrdersAnswer {
  fields: OrderFormFields | undefined;
  rejection: OrderRejection | undefined;
  cancelFailure: string | undefined;
  limitSteps: readonly Rupiah[] | undefined;
}

export interface OrdersForm {
  form: FormData;
  place: Pick<TradingPlace, "classId" | "owner">;
  now: Date;
}

export interface SentOrderForm extends OrdersForm {
  code: string;
  side: OrderSide;
  ticketPath: string;
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

/** A different total needs another confirmation, including when the reader edited the form before JavaScript loaded. */
export function placeFromForm(
  context: Readonly<RouterContextProvider>,
  { form, place, now, code, side, ticketPath }: SentOrderForm,
): Response | ReturnType<typeof data<OrdersAnswer>> {
  const { delayMinutes } = readPriceSourceDescription(context);
  const day = orderTradingDay(now, delayMinutes);
  if (!day.ok) {
    return answer(
      {
        fields: typedOrderForm(form),
        rejection: {
          text: orderFailureText(day.failure, place.owner.kind),
          lotsStep: undefined,
        },
      },
      failureStatuses[day.failure.kind],
    );
  }
  const seenTotal = parseSeenTotal(
    form.get("seenTotal"),
    m.trading_ticket_breakdown_title(),
  );
  if (!seenTotal.ok)
    return answer(
      {
        fields: typedOrderForm(form),
        rejection: { text: seenTotal.failure, lotsStep: undefined },
      },
      400,
    );
  const request = readOrderForm(form, {
    code,
    side,
    maximumLots: day.value.rules.maximumLots,
    placedAt: now,
  });
  if (!request.ok) {
    return answer({ fields: request.failure }, 400);
  }
  const placed = placePortfolioOrder(
    context.get(databaseContext),
    request.value,
    {
      owner: place.owner,
      delayMinutes,
      seenTotal: seenTotal.value,
    },
  );
  if (placed.ok) {
    return redirect(
      pathWithQuery(ticketPath, { placed: String(placed.value) }),
    );
  }
  const { failure } = placed;
  const fields = typedOrderForm(form);
  if (failure.kind === "previewChanged") {
    return answer(
      {
        fields,
        rejection: {
          text: m.trading_preview_changed_notice(),
          lotsStep: undefined,
        },
      },
      409,
    );
  }
  return rejectOrder(failure, {
    fields,
    request: request.value,
    portfolioKind: place.owner.kind,
  });
}

function rejectOrder(
  failure: OrderFailure,
  {
    fields,
    request,
    portfolioKind,
  }: {
    fields: OrderFormFields;
    request: OrderRequest;
    portfolioKind: PortfolioKind;
  },
): ReturnType<typeof data<OrdersAnswer>> {
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
        limitSteps:
          failure.kind === "offTick"
            ? [failure.below, failure.above]
            : [
                request.price.kind === "limit" &&
                request.price.limit < failure.lowest
                  ? failure.lowest
                  : failure.highest,
              ],
      },
      status,
    );
  }
  const lotsStep = lotsStepOf(failure);
  return answer(
    {
      fields,
      rejection: {
        text: orderFailureText(failure, portfolioKind),
        lotsStep,
        ...(lotsStep === undefined ? {} : { field: "lots" as const }),
      },
    },
    status,
  );
}

/** A forged form or a manual deletion can name an order that the owner does not have. */
export function cancelFromForm(
  context: Readonly<RouterContextProvider>,
  { form, place, now }: OrdersForm,
  returnPath = activityPath(place.classId, place.owner.kind),
): Response | ReturnType<typeof data<OrdersAnswer>> {
  const orderId = parseRecordId<OrderId>(form.get("cancel"), "cancel");
  const cancelled = orderId.ok
    ? cancelPortfolioOrder(
        context.get(databaseContext),
        { owner: place.owner, orderId: orderId.value },
        now,
      )
    : fail<CancelFailure>({ kind: "missing" });
  if (cancelled.ok) {
    return redirect(returnPath);
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
      rejection: parts.rejection,
      cancelFailure: parts.cancelFailure,
      limitSteps: parts.limitSteps,
    },
    { status },
  );
}
