import type { ReactNode } from "react";
import { ConceptHelp } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { formatRupiah } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { priceKindOptions } from "./order-form-fields";
import { TicketDraftLink } from "./ticket-draft-link";
import type { TicketDraft } from "./use-ticket-draft";
import styles from "./ticket.module.css";
import { TicketSchedule } from "./ticket-schedule";

export function TicketKind({ draft }: { draft: TicketDraft }): ReactNode {
  const { values, ticket } = draft;
  const { quote, day } = ticket;
  return (
    <section className={styles["section"]}>
      <div className={styles["label"]}>
        {m.trading_price_kind_label()}
        <ConceptHelp title={m.trading_price_kind_label()}>
          <p>{m.trading_ticket_kind_body()}</p>
          <ConceptLesson termId="order-pasar" />
        </ConceptHelp>
      </div>
      <nav
        className={styles["segments"]}
        aria-label={m.trading_price_kind_label()}
        aria-describedby="ticket-kind-failure"
      >
        {priceKindOptions().map(({ value, label }) => (
          <span key={value} data-selected={values.priceKind === value}>
            <TicketDraftLink
              draft={draft}
              name="priceKind"
              value={value}
              label={label}
            />
          </span>
        ))}
      </nav>
      <p
        id="ticket-kind-failure"
        role="alert"
        className={styles["issue"]}
        hidden={values.priceKindFailure === undefined}
      >
        {values.priceKindFailure}
      </p>
      {values.priceKind === "market" && (
        <p className={styles["muted"]}>
          {ticket.canFillNow ? (
            <NumberText>
              {m.trading_ticket_market_now_notice({
                price: formatRupiah(quote.price),
              })}
            </NumberText>
          ) : (
            <TicketSchedule {...day.value} />
          )}
        </p>
      )}
    </section>
  );
}
