import { checkFieldLengthForReader, typedText } from "~/form-text";
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

/** The kind of the price of an order: the delayed price when it fills, or a limit that the price must reach. */
export type PriceKind = OrderRequest["price"]["kind"];

/** An option of a field of the order form, with the value that the form sends and the label that the reader sees. */
export interface FormOption<Value extends string> {
  value: Value;
  label: string;
}

/** The fields of the order form as the student filled them in, so that the form can show them again, with the reason that each was not accepted. */
export interface OrderFormFields {
  code: string;
  side: string;
  priceKind: string;
  lots: string;
  limit: string;
  codeFailure: string | undefined;
  sideFailure: string | undefined;
  priceKindFailure: string | undefined;
  lotsFailure: string | undefined;
  limitFailure: string | undefined;
}

// The example shows a group of digits in the format of the language, as the example of every whole number does.
const limitExample = 1_000;

/** The options of the side of an order, in the active language. */
export function sideOptions(): FormOption<OrderSide>[] {
  return [
    { value: "buy", label: m.trading_buy_label() },
    { value: "sell", label: m.trading_sell_label() },
  ];
}

/** The options of the kind of price of an order, in the active language. */
export function priceKindOptions(): FormOption<PriceKind>[] {
  return [
    { value: "market", label: m.trading_market_order_label() },
    { value: "limit", label: m.trading_limit_order_label() },
  ];
}

/** Reads an order from the form that a student sent at a moment, for the stocks that Portolab tracks and with the largest order of the trading day that orderTradingDay gives. It reads the limit price only for a limit order, because a market order has none. The failure holds what each field holds and why each was not accepted. */
export function readOrderForm(
  form: FormData,
  order: { codes: readonly string[]; maximumLots: Lots; placedAt: Date },
): Result<OrderRequest, OrderFormFields> {
  const code = parseStockCode(
    form.get("code"),
    m.trading_stock_label(),
    order.codes,
  );
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
  if (!code.ok || !side.ok || !lots.ok || !price?.ok) {
    return fail({
      ...typedOrderForm(form),
      codeFailure: failureOf(code),
      sideFailure: failureOf(side),
      priceKindFailure: failureOf(priceKind),
      lotsFailure: failureOf(lots),
      limitFailure: price === undefined ? undefined : failureOf(price),
    });
  }
  return succeed({
    code: code.value,
    side: side.value,
    lots: lots.value,
    price: price.value,
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
  code: "",
  side: "",
  priceKind: "market",
  lots: "",
  limit: "",
  codeFailure: undefined,
  sideFailure: undefined,
  priceKindFailure: undefined,
  lotsFailure: undefined,
  limitFailure: undefined,
};

/** What each field of the order form holds as the student typed it, without a reason for any field. */
export function typedOrderForm(form: FormData): OrderFormFields {
  return {
    code: typedText(form.get("code")),
    side: typedText(form.get("side")),
    priceKind: typedText(form.get("priceKind")),
    lots: typedText(form.get("lots")),
    limit: typedText(form.get("limit")),
    codeFailure: undefined,
    sideFailure: undefined,
    priceKindFailure: undefined,
    lotsFailure: undefined,
    limitFailure: undefined,
  };
}

/** Reads the code of the stock that the order form sent, which is one of the stocks in the list of the field. The source is the label of the field, and the failure is a sentence for the reader in the current language. */
function parseStockCode(
  value: unknown,
  source: string,
  codes: readonly string[],
): Result<string, string> {
  const chosen = parseChosenText(value, source);
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
  options: readonly FormOption<Value>[],
): Result<Value, string> {
  const chosen = parseChosenText(value, source);
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

/** Reads the text of a field of choices, which is undefined when the field holds no choice. A choice is never longer than a field takes, so a longer text fails before any other work on it. */
function parseChosenText(
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
