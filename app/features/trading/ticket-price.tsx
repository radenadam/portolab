import type { ReactNode } from "react";
import { formatNumber, formatRupiah } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { TicketBand } from "./ticket-band";
import { TicketDraftLink } from "./ticket-draft-link";
import { ticketPriceStep } from "./ticket-price-step";
import type { TicketDraft } from "./use-ticket-draft";
import styles from "./ticket.module.css";
import type { Rupiah } from "~/units/rupiah";

export function TicketPrice({
  draft,
  steps,
}: {
  draft: TicketDraft;
  steps: readonly Rupiah[] | undefined;
}): ReactNode {
  const { values, price, ticket } = draft;
  const { rules } = ticket.day.value;
  if (values.priceKind !== "limit")
    return <input type="hidden" name="limit" value={values.limit} />;
  return (
    <section className={styles["section"]}>
      <label className={styles["label"]} htmlFor="ticket-limit">
        {m.trading_limit_price_label()}
      </label>
      <div className={styles["stepper"]}>
        <TicketDraftLink
          draft={draft}
          name="limit"
          value={formatNumber(
            ticketPriceStep(price ?? ticket.quote.price, -1, rules),
          )}
          label={m.trading_ticket_price_down_label()}
          symbol="−"
        />
        <input
          id="ticket-limit"
          name="limit"
          inputMode="numeric"
          autoComplete="off"
          value={values.limit}
          onChange={(event) => {
            draft.change("limit", event.target.value, event.currentTarget.form);
          }}
          aria-invalid={values.limitFailure !== undefined}
          aria-describedby="ticket-limit-failure"
        />
        <TicketDraftLink
          draft={draft}
          name="limit"
          value={formatNumber(
            ticketPriceStep(price ?? ticket.quote.price, 1, rules),
          )}
          label={m.trading_ticket_price_up_label()}
          symbol="+"
        />
      </div>
      {ticket.range?.ok === true && (
        <TicketBand range={ticket.range.value} price={price} />
      )}
      <p
        id="ticket-limit-failure"
        className={styles["issue"]}
        hidden={values.limitFailure === undefined}
      >
        {values.limitFailure}
      </p>
      {steps !== undefined && (
        <div className={styles["chips"]}>
          {steps.map((price) => (
            <TicketDraftLink
              key={price}
              draft={draft}
              name="limit"
              value={formatNumber(price)}
              label={m.trading_ticket_price_fix_label({
                price: formatRupiah(price),
              })}
              className={styles["fix"]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
