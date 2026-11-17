import type { ReactNode } from "react";
import { ConceptHelp } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { formatRupiah } from "~/formatting";
import { NumberText } from "~/number-text";
import { SelectField } from "~/form";
import { m } from "~/paraglide/messages.js";
import { priceKindOptions } from "./order-form-fields";
import { TicketDraftLink } from "./ticket-draft-link";
import type { TicketDraft } from "./use-ticket-draft";
import styles from "./ticket.module.css";
import { TicketSchedule } from "./ticket-schedule";

export function TicketKind({ draft }: { draft: TicketDraft }): ReactNode {
  const { values, ticket } = draft;
  const { quote, day } = ticket;
  const options = priceKindOptions();
  const hasChoice = options.some((option) => option.value === values.priceKind);
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
      >
        {options.map(({ value, label }) => (
          <TicketDraftLink
            key={value}
            draft={draft}
            name="priceKind"
            value={value}
            label={label}
            selected={values.priceKind === value}
          />
        ))}
      </nav>
      {hasChoice ? (
        <input type="hidden" name="priceKind" value={values.priceKind} />
      ) : (
        <SelectField
          name="priceKind"
          label={m.trading_price_kind_label()}
          options={[
            { value: values.priceKind, label: values.priceKind },
            ...options,
          ]}
          defaultValue={values.priceKind}
          failure={values.priceKindFailure}
        />
      )}
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
