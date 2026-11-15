import type { FieldOption } from "~/form";
import { checkMaximumLength, parseOptionalText, typedText } from "~/form-text";
import { formatList, formatNumber } from "~/formatting";
import { characterCount } from "~/character-count";
import { m } from "~/paraglide/messages.js";
import { failureOf, fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { Lots } from "~/units/lots";
import { isRupiah, rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { parseWrittenWholeNumber } from "~/written-whole-number";
import { checkFieldLength } from "~/check-field-length";
import { parseChoice } from "~/value-parsers";
import type { OrderRequest, OrderSide } from "./order";
import { parseOrderLots } from "./parse-order-lots";
import { reasonMaximumLength } from "./reason-maximum-length";

/** The kind of the price of an order: the delayed price when it fills, or a limit that the price must reach. */
type PriceKind = OrderRequest["price"]["kind"];

const sideLabels: Record<OrderSide, () => string> = {
  buy: m.trading_buy_label,
  sell: m.trading_sell_label,
};

export function orderSideLabel(side: OrderSide): string {
  return sideLabels[side]();
}

/** The fields of the order form as the student filled them in, so that the form can show them again, with the reason that each was not accepted. */
export interface OrderFormFields {
  priceKind: string;
  lots: string;
  limit: string;
  reason: string;
  priceKindFailure: string | undefined;
  lotsFailure: string | undefined;
  limitFailure: string | undefined;
  reasonFailure: string | undefined;
}

export const orderDraftFields = [
  ["priceKind", "priceKindFailure"],
  ["lots", "lotsFailure"],
  ["limit", "limitFailure"],
  ["reason", "reasonFailure"],
] as const;

// The example shows a group of digits in the format of the language, as the example of every whole number does.
const limitExample = 1_000;

/** The options of the side of an order, in the active language. */
export function sideOptions(): FieldOption<OrderSide>[] {
  return [
    { value: "buy", label: orderSideLabel("buy") },
    { value: "sell", label: orderSideLabel("sell") },
  ];
}

/** The options of the kind of price of an order, in the active language. */
export function priceKindOptions(): FieldOption<PriceKind>[] {
  return [
    { value: "market", label: m.trading_ticket_market_label() },
    { value: "limit", label: m.trading_ticket_limit_label() },
  ];
}

/** Reads an order of a stock from the form that a student sent at a moment, with the largest order of the trading day that orderTradingDay gives. The stock comes from the address of the page, which parseStockCode reads, because the form places the order of the stock whose price the page shows. It reads the limit price only for a limit order, because a market order has none, and the reason that the student may write. The failure holds what each field holds and why each was not accepted. */
export function readOrderForm(
  form: FormData,
  order: {
    code: string;
    side: OrderSide;
    maximumLots: Lots;
    placedAt: Date;
    unknownPriceKind?: typeof m.trading_unknown_choice_error;
  },
): Result<OrderRequest, OrderFormFields> {
  const priceKind = parseOrderChoice(
    form.get("priceKind"),
    m.trading_price_kind_label(),
    {
      options: priceKindOptions(),
      ...(order.unknownPriceKind === undefined
        ? {}
        : { unknownChoice: order.unknownPriceKind }),
    },
  );
  const lots = parseOrderLots(
    form.get("lots"),
    m.trading_lots_label(),
    order.maximumLots,
  );
  // The price of an order depends on its kind, so a form without a valid kind has no price to read.
  const price = priceKind.ok ? readPrice(form, priceKind.value) : undefined;
  const reason = parseOrderReason(form.get("reason"), m.trading_reason_label());
  if (!lots.ok || !price?.ok || !reason.ok) {
    return fail({
      ...typedOrderForm(form),
      priceKindFailure: failureOf(priceKind),
      lotsFailure: failureOf(lots),
      limitFailure: price === undefined ? undefined : failureOf(price),
      reasonFailure: failureOf(reason),
    });
  }
  return succeed({
    code: order.code,
    side: order.side,
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
  priceKind: "market",
  lots: "",
  limit: "",
  reason: "",
  priceKindFailure: undefined,
  lotsFailure: undefined,
  limitFailure: undefined,
  reasonFailure: undefined,
};

/** What each field of the order form holds as the student typed it, without a reason for any field. */
export function typedOrderForm(form: FormData): OrderFormFields {
  return {
    priceKind: typedText(form.get("priceKind")),
    lots: typedText(form.get("lots")),
    limit: typedText(form.get("limit")),
    reason: typedText(form.get("reason")),
    priceKindFailure: undefined,
    lotsFailure: undefined,
    limitFailure: undefined,
    reasonFailure: undefined,
  };
}

/** Stock routes answer 404 for an unknown code, so this boundary returns diagnostics rather than chooser-field messages. */
export function parseStockCode(
  value: unknown,
  source: string,
  codes: readonly string[],
): Result<string, string> {
  if (typeof value === "string") {
    const bounded = checkFieldLength(value);
    if (!bounded.ok)
      return fail(
        `${source} must name a tracked stock, but it has ${String(bounded.failure)} characters, more than this input takes.`,
      );
  }
  return parseChoice(value, source, codes);
}

/** A field supplies the labels of its options so that a refusal names what the reader can choose. The source is the label of the field in the current language. */
export function parseOrderChoice<Value extends string>(
  value: unknown,
  source: string,
  configuration: {
    options: readonly FieldOption<Value>[];
    unknownChoice?: (inputs: {
      field: string;
      value: string;
      choices: string;
    }) => string;
    longChoice?: (inputs: {
      field: string;
      length: string;
      choices: string;
    }) => string;
  },
): Result<Value, string> {
  const {
    options,
    unknownChoice = m.trading_unknown_choice_error,
    longChoice,
  } = configuration;
  const chosen = parseOptionalOrderText(value, source);
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
  const length = characterCount(chosen.value.trim());
  const maximum = Math.max(
    ...options.map((candidate) => characterCount(candidate.value)),
  );
  if (option === undefined && longChoice !== undefined && length > maximum) {
    return fail(
      longChoice({ field: source, length: formatNumber(length), choices }),
    );
  }
  return option === undefined
    ? fail(
        unknownChoice({
          field: source,
          value: chosen.value.trim(),
          choices,
        }),
      )
    : succeed(option.value);
}

/** Reads the limit price of an order as a student writes it, in whole rupiah, as digits alone or with the separators of digit groups where the active language writes them. The check of the order compares it with the auto rejection limits of its trading day, which name the prices that IDX accepts, so a price with more digits than a whole number of rupiah holds exactly reads as the highest such amount, which lies above every price that IDX accepts. */
export function parseLimitPrice(
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
  const text = parseOptionalOrderText(value, source);
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
export function parseOptionalOrderText(
  value: unknown,
  source: string,
): Result<string | undefined, string> {
  const text = parseOptionalText(value, source);
  if (!text.ok) return text;
  return succeed(text.value === "" ? undefined : text.value);
}

/** The address chooses the side, so a form cannot change it. */
export function parseOrderSide(
  value: unknown,
  source: string,
): Result<OrderSide, string> {
  return parseOrderChoice(value, source, { options: sideOptions() });
}
