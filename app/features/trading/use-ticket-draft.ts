import { ticketQuickLots } from "./ticket-quick-lots";
import type { TicketFraction } from "./ticket-quick-lots";
import { m } from "~/paraglide/messages.js";
import { parseOrderLots } from "./parse-order-lots";
import type { Rupiah } from "~/units/rupiah";
import { useState, use, useCallback } from "react";
import type { OrderSide } from "./order";
import type { OrderFormFields } from "./order-form-fields";
import { parseLimitPrice, typedOrderForm } from "./order-form-fields";
import type { readTicket } from "./read-ticket.server";
import { shares } from "~/units/shares";
import { ticketAmounts } from "./ticket-amounts";
import { TicketDraftContext } from "./ticket-draft-memory";

export function useTicketDraft({
  fields,
  side: initialSide,
  path,
  search,
  ticket,
  restoreDraft,
}: {
  fields: OrderFormFields;
  side: OrderSide;
  path: string;
  search: string;
  ticket: ReturnType<typeof readTicket> & {
    day: { ok: true };
    quote: NonNullable<ReturnType<typeof readTicket>["quote"]>;
  };
  restoreDraft: boolean;
}) {
  const memory = use(TicketDraftContext);
  const [values, setValues] = useState(fields);
  const [side, setSide] = useState(initialSide);
  const formRef = useCallback(
    (form: HTMLFormElement | null) => {
      if (form === null) return;
      const native = typedOrderForm(new FormData(form));
      const next = { ...fields };
      for (const [name, failure] of [
        ["priceKind", "priceKindFailure"],
        ["lots", "lotsFailure"],
        ["limit", "limitFailure"],
        ["reason", "reasonFailure"],
      ] as const) {
        next[name] = native[name];
        if (native[name] !== fields[name]) next[failure] = undefined;
      }
      const edited = (["priceKind", "lots", "limit", "reason"] as const).some(
        (name) => native[name] !== fields[name],
      );
      const restored =
        restoreDraft && !edited ? (memory?.get(initialSide) ?? next) : next;
      memory?.set(initialSide, restored);
      setValues(restored);
    },
    [fields, initialSide, memory, restoreDraft],
  );
  const { rules, rates } = ticket.day.value;
  const parsedLots = parseOrderLots(
    values.lots,
    m.trading_lots_label(),
    rules.maximumLots,
  );
  const count = parsedLots.ok ? parsedLots.value : undefined;
  const price = draftPrice(values, ticket.quote.price);
  const amounts =
    count === undefined ||
    price === undefined ||
    (values.priceKind === "limit" &&
      (ticket.range?.ok !== true || price > ticket.range.value.highest)) ||
    !Number.isSafeInteger(price * count * rules.lotShares)
      ? undefined
      : ticketAmounts(side, {
          price,
          shares: shares(count * rules.lotShares),
          rates,
          available: ticket.available,
        });
  const quickPrice = quickPriceOf(price, ticket);
  function remember(next: OrderFormFields) {
    memory?.set(side, next);
    setValues(next);
  }

  return {
    values,
    unchanged:
      side === initialSide &&
      (["priceKind", "lots", "limit", "reason"] as const).every(
        (name) => values[name] === fields[name],
      ),
    formRef,
    side,
    chooseSide(next: OrderSide, form: HTMLFormElement | null) {
      const current =
        form === null ? values : typedOrderForm(new FormData(form));
      remember(current);
      memory?.set(next, current);
      setSide(next);
    },
    count,
    price,
    amounts,
    quickLots(fraction: TicketFraction) {
      return ticketQuickLots(side, fraction, {
        available: ticket.available,
        free: ticket.free,
        price: quickPrice,
        day: ticket.day.value,
      });
    },
    ticket,
    action: `${path}/${side}${search}`,
    change(
      name: "lots" | "limit" | "priceKind" | "reason",
      value: string,
      form: HTMLFormElement | null,
    ) {
      const current =
        form === null ? values : typedOrderForm(new FormData(form));
      const next = { ...current, [name]: value };
      remember(next);
    },
  };
}

export type TicketDraft = Omit<ReturnType<typeof useTicketDraft>, "formRef">;

function quickPriceOf(
  price: ReturnType<typeof useTicketDraft>["price"],
  ticket: Parameters<typeof useTicketDraft>[0]["ticket"],
) {
  return price !== undefined &&
    ticket.range?.ok === true &&
    price <= ticket.range.value.highest &&
    Number.isSafeInteger(price * ticket.day.value.rules.lotShares) &&
    price > 0
    ? price
    : ticket.quote.price;
}

function draftPrice(
  values: OrderFormFields,
  quote: Rupiah,
): Rupiah | undefined {
  switch (values.priceKind) {
    case "market":
      return quote;
    case "limit": {
      const price = parseLimitPrice(
        values.limit,
        m.trading_limit_price_label(),
      );
      return price.ok ? price.value : undefined;
    }
    default:
      return undefined;
  }
}
