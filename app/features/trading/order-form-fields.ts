import type { FieldOption } from "~/form";
import {
  checkFieldLengthForReader,
  checkMaximumLength,
  typedText,
} from "~/form-text";
import { formatList } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { failureOf, fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { Lots } from "~/units/lots";
import { isRupiah, rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { typeName } from "~/value-shapes";
import { parseWrittenWholeNumber } from "~/written-whole-number";
import type { OrderRequest, OrderSide } from "./order";
import { parseOrderLots } from "./parse-order-lots";
import { reasonMaximumLength } from "./reason-maximum-length";

/** The kind of the price of an order: the delayed price when it fills, or a limit that the price must reach. */
export type PriceKind = OrderRequest["price"]["kind"];

/** The fields of the order form as the student filled them in, so that the form can show them again, with the reason that each was not accepted. */
export interface OrderFormFields {
  side: string;
  priceKind: string;
  lots: string;
  limit: string;
  reason: string;
  sideFailure: string | undefined;
  priceKindFailure: string | undefined;
  lotsFailure: string | undefined;
  limitFailure: string | undefined;
  reasonFailure: string | undefined;
}

/** The name of the button of a rejection that changes the lots of the order form to those that it offers, which a form sends only when the student taps it. */
export const lotsStepName = "lotsStep";

// The example shows a group of digits in the format of the language, as the example of every whole number does.
const limitExample = 1_000;

/** The options of the side of an order, in the active language. */
export function sideOptions(): FieldOption<OrderSide>[] {
  return [
    { value: "buy", label: m.trading_buy_label() },
    { value: "sell", label: m.trading_sell_label() },
  ];
}

/** The options of the kind of price of an order, in the active language. */
export function priceKindOptions(): FieldOption<PriceKind>[] {
  return [
    { value: "market", label: m.trading_market_order_label() },
    { value: "limit", label: m.trading_limit_order_label() },
  ];
}

/** Reads an order of a stock from the form that a student sent at a moment, with the largest order of the trading day that orderTradingDay gives. The stock comes from the address of the page, which parseStockCode reads, because the form places the order of the stock whose price the page shows. It reads the limit price only for a limit order, because a market order has none, and the reason that the student may write. The failure holds what each field holds and why each was not accepted. */
export function readOrderForm(
  form: FormData,
  order: { code: string; maximumLots: Lots; placedAt: Date },
): Result<OrderRequest, OrderFormFields> {
  const side = parseOrderChoice(
    form.get("side"),
    m.trading_side_label(),
    sideOptions(),
  );
  const priceKind = parseOrderChoice(
    form.get("priceKind"),
    m.trading_price_kind_label(),
    priceKindOptions(),
  );
  const lots = parseOrderLots(
    form.get("lots"),
    m.trading_lots_label(),
    order.maximumLots,
  );
  // The price of an order depends on its kind, so a form without a valid kind has no price to read.
  const price = priceKind.ok ? readPrice(form, priceKind.value) : undefined;
  const reason = parseOrderReason(form.get("reason"), m.trading_reason_label());
  if (!side.ok || !lots.ok || !price?.ok || !reason.ok) {
    return fail({
      ...typedOrderForm(form),
      sideFailure: failureOf(side),
      priceKindFailure: failureOf(priceKind),
      lotsFailure: failureOf(lots),
      limitFailure: price === undefined ? undefined : failureOf(price),
      reasonFailure: failureOf(reason),
    });
  }
  return succeed({
    code: order.code,
    side: side.value,
    lots: lots.value,
    price: price.value,
    reason: reason.value,
    placedAt: order.placedAt,
  });
}

function readPrice(
  form: FormData,
  kind: PriceKind,
): Result<OrderRequest["price"], string> {
  switch (kind) {
    case "market":
      return succeed({ kind: "market" });
    case "limit": {
      const limit = parseLimitPrice(
        form.get("limit"),
        m.trading_limit_price_label(),
      );
      return limit.ok ? succeed({ kind: "limit", limit: limit.value }) : limit;
    }
  }
}

/** The order form before the student sends it, which chooses a market order, because it needs no price. */
export const blankOrderForm: OrderFormFields = {
  side: "",
  priceKind: "market",
  lots: "",
  limit: "",
  reason: "",
  sideFailure: undefined,
  priceKindFailure: undefined,
  lotsFailure: undefined,
  limitFailure: undefined,
  reasonFailure: undefined,
};

/** What each field of the order form holds as the student typed it, without a reason for any field. */
export function typedOrderForm(form: FormData): OrderFormFields {
  return {
    side: typedText(form.get("side")),
    priceKind: typedText(form.get("priceKind")),
    lots: typedText(form.get("lots")),
    limit: typedText(form.get("limit")),
    reason: typedText(form.get("reason")),
    sideFailure: undefined,
    priceKindFailure: undefined,
    lotsFailure: undefined,
    limitFailure: undefined,
    reasonFailure: undefined,
  };
}

/** Reads the stock that the address of the orders chose, which is one of the stocks in the list of the field that chooses it. The form that chooses a stock sends its field in the address, so the source is the label of that field, and the failure is a sentence for the reader in the current language. */
export function parseStockCode(
  value: unknown,
  source: string,
  codes: readonly string[],
): Result<string, string> {
  const chosen = parseOptionalText(value, source);
  if (!chosen.ok) {
    return chosen;
  }
  if (chosen.value === undefined) {
    return fail(m.trading_no_stock_error({ field: source }));
  }
  const code = codes.find((candidate) => candidate === chosen.value);
  return code === undefined
    ? fail(
        m.trading_unknown_stock_error({
          field: source,
          value: chosen.value.trim(),
        }),
      )
    : succeed(code);
}

/** Reads the option that a field of the order form sent, which is one of the values of its options. The source is the label of the field, and the failure is a sentence for the reader in the current language that names the labels of the options. */
function parseOrderChoice<Value extends string>(
  value: unknown,
  source: string,
  options: readonly FieldOption<Value>[],
): Result<Value, string> {
  const chosen = parseOptionalText(value, source);
  if (!chosen.ok) {
    return chosen;
  }
  const choices = formatList(
    options.map((option) => `"${option.label}"`),
    "disjunction",
  );
  if (chosen.value === undefined) {
    return fail(m.trading_no_choice_error({ field: source, choices }));
  }
  const option = options.find((candidate) => candidate.value === chosen.value);
  return option === undefined
    ? fail(
        m.trading_unknown_choice_error({
          field: source,
          value: chosen.value.trim(),
          choices,
        }),
      )
    : succeed(option.value);
}

/** Reads the limit price of an order as a student writes it, in whole rupiah, as digits alone or with the separators of digit groups where the active language writes them. The check of the order compares it with the auto rejection limits of its trading day, which name the prices that IDX accepts, so a price with more digits than a whole number of rupiah holds exactly reads as the highest such amount, which lies above every price that IDX accepts. */
function parseLimitPrice(
  value: unknown,
  source: string,
): Result<Rupiah, string> {
  const number = parseWrittenWholeNumber(value, source, {
    example: limitExample,
    message: m.trading_limit_not_whole_error,
  });
  if (!number.ok) {
    return number;
  }
  const amount = Number(number.value.digits);
  return succeed(isRupiah(amount) ? amount : rupiah(Number.MAX_SAFE_INTEGER));
}

/** Reads the reason of an order as the student wrote it, without the spaces around it, with each line break as one character, and undefined when the student wrote none. A reason keeps its lines, because a student may write it in several paragraphs. The source is the label of the field, and the failure is a sentence for the reader in the current language. */
function parseOrderReason(
  value: unknown,
  source: string,
): Result<string | undefined, string> {
  const text = parseOptionalText(value, source);
  if (!text.ok || text.value === undefined) {
    return text;
  }
  // A browser sends each line break of a field of several lines as a carriage return and a line feed, which a reader counts as one character.
  const tidied = text.value.trim().replace(/\r\n?/g, "\n").normalize("NFC");
  if (tidied === "") {
    return succeed(undefined);
  }
  return checkMaximumLength(tidied, source, reasonMaximumLength);
}

/** Reads the text of a field that a person may leave empty, such as a field of choices, which is undefined when the field holds nothing. A text longer than any field takes fails before any other work on it. */
function parseOptionalText(
  value: unknown,
  source: string,
): Result<string | undefined, string> {
  if (value === null || value === "") {
    return succeed(undefined);
  }
  if (typeof value !== "string") {
    return fail(m.app_not_text_error({ field: source, type: typeName(value) }));
  }
  return checkFieldLengthForReader(value, source);
}
