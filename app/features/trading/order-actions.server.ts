import { data, redirect } from "react-router";
import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readPriceSourceDescription } from "~/features/market-data/price-source-context.server";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import { formatMarketTime } from "~/formatting";
import { typedText } from "~/form-text";
import { m } from "~/paraglide/messages.js";
import { fail } from "~/result";
import type { Lots } from "~/units/lots";
import { parseRecordId } from "~/value-parsers";
import { cancelPortfolioOrder } from "./cancel-portfolio-order.server";
import type { CancelFailure } from "./cancel-portfolio-order.server";
import { lotCount } from "./count-parts";
import { findStudentPlace } from "./find-student-place.server";
import type { StudentPlace } from "./find-student-place.server";
import type { OrderFailure } from "./order";
import { lotsStepOf } from "./lots-step";
import { limitPriceFailureText, orderFailureText } from "./order-failure-text";
import {
  lotsStepName,
  parseStockCode,
  readOrderForm,
  typedOrderForm,
} from "./order-form-fields";
import type { OrderFormFields } from "./order-form-fields";
import { orderTradingDay } from "./order-trading-day";
import { ordersPath } from "./orders-path";
import { placePortfolioOrder } from "./place-portfolio-order.server";
import type { OrderId } from "./trading.schema";

/** Why Portolab did not accept an order as a whole, with the lots of an order that it would accept in place of it, which the rejection offers as its next step, or undefined when no number of lots would do. */
export interface OrderRejection {
  text: string;
  lotsStep: Lots | undefined;
}

/** The answer of the action of the orders to a form that it did not accept, or to the step of a rejection: the order form as the student sent it with the reason for each field, why the order was not accepted as a whole, why the stock that the address chose was not accepted, and why no order was cancelled. */
export interface OrdersAnswer {
  fields: OrderFormFields | undefined;
  rejection: OrderRejection | undefined;
  stockFailure: string | undefined;
  cancelFailure: string | undefined;
}

/** A form that a student sent to the orders of a class at a moment. @internal Tests send it to placeFromForm and cancelFromForm directly, because ticketAction reaches them only with the real clock. */
export interface OrdersForm {
  form: FormData;
  place: Pick<StudentPlace, "classId" | "owner">;
  now: Date;
}

/** An order form that a student sent, with the stock that the address of the page chose, as the address sends it. @internal Tests send it to placeFromForm directly, because ticketAction reaches it only with the real clock. */
export interface SentOrderForm extends OrdersForm {
  chosenStock: string | null;
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

/** Places the order of the form for the stock that the address chose and opens the orders with the notice that Portolab accepted it, or answers with the reason that the form, the stock, or the order was not accepted. The step of a rejection changes the lots of the form instead. @internal Tests call it directly, because ticketAction reaches it only with the real clock. */
export function placeFromForm(
  context: Readonly<RouterContextProvider>,
  { form, place, now, chosenStock }: SentOrderForm,
): Response | ReturnType<typeof data<OrdersAnswer>> {
  // The step of a rejection changes the lots of the order form to those that it offers, and the student sends the order again after reading it.
  if (form.has(lotsStepName)) {
    return answer(
      {
        fields: {
          ...typedOrderForm(form),
          lots: typedText(form.get(lotsStepName)),
        },
      },
      200,
    );
  }
  const { delayMinutes } = readPriceSourceDescription(context);
  const day = orderTradingDay(now, delayMinutes);
  if (!day.ok) {
    return answer(
      {
        fields: typedOrderForm(form),
        rejection: { text: orderFailureText(day.failure), lotsStep: undefined },
      },
      failureStatuses[day.failure.kind],
    );
  }
  // The order form appears only on a page whose address holds a stock that Portolab trades, so this reason belongs to an address that someone changed, and the page shows it at the field that chooses a stock.
  const code = parseStockCode(
    chosenStock,
    m.trading_stock_label(),
    trackedStockCodes,
  );
  if (!code.ok) {
    return answer({ stockFailure: code.failure }, 400);
  }
  const request = readOrderForm(form, {
    code: code.value,
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
  return answer(
    {
      fields,
      rejection: {
        text: orderFailureText(failure),
        lotsStep: lotsStepOf(failure),
      },
    },
    status,
  );
}

/** Cancels the order that the form names and opens the orders again, or answers with the reason that no order was cancelled. A number that names no order of the student, which only a forged form or a deletion by hand leads to, is a missing order. @internal Tests call it directly, because ticketAction reaches it only with the real clock. */
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
      rejection: parts.rejection,
      stockFailure: parts.stockFailure,
      cancelFailure: parts.cancelFailure,
    },
    { status },
  );
}

/** What the action of a page with the order ticket receives from React Router, of which the class of the address chooses the portfolio. The url is the one that React Router gives an action. */
export interface TicketActionArgs {
  context: Readonly<RouterContextProvider>;
  request: Request;
  params: { classId: string };
  url: URL;
}

/** The action of a page with the order ticket, which answers the form that it sends: the order form, its step after a rejection, or a form that cancels an order of the list of the orders. Each order in the list has a form that sends only the number of the order to cancel, and the order form never sends it. */
export async function ticketAction({
  context,
  request,
  params,
  url,
}: TicketActionArgs): Promise<
  Response | ReturnType<typeof data<OrdersAnswer>>
> {
  const now = new Date();
  const place = findStudentPlace(context, url, params.classId);
  const form = await request.formData();
  return form.has("cancel")
    ? cancelFromForm(context, { form, place, now })
    : placeFromForm(context, {
        form,
        place,
        now,
        chosenStock: url.searchParams.get("code"),
      });
}
