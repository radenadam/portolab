import type { ReactNode } from "react";
import { ConceptHelp } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { formatNumber, formatPercent, formatRupiah } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { smallestOrderLots } from "~/units/lots";
import { shares } from "~/units/shares";
import { lotCount, shareCount } from "./count-parts";
import type { OrderRejection } from "./order-actions.server";
import { TicketDraftLink } from "./ticket-draft-link";
import type { TicketDraft } from "./use-ticket-draft";
import styles from "./ticket.module.css";

export function TicketLots({
  draft,
  rejection,
}: {
  draft: TicketDraft;
  rejection: OrderRejection | undefined;
}): ReactNode {
  const { values, count, ticket } = draft;
  const { rules } = ticket.day.value;
  return (
    <section className={styles["section"]}>
      <div className={styles["between"]}>
        <div className={styles["label"]}>
          <label htmlFor="ticket-lots">{m.trading_lots_label()}</label>
          <ConceptHelp title={m.trading_lots_label()}>
            <p>
              <NumberText>
                {m.trading_lots_hint({
                  shares: shareCount(rules.lotShares),
                  smallest: lotCount(smallestOrderLots),
                  largest: lotCount(rules.maximumLots),
                })}
              </NumberText>
            </p>
            <ConceptLesson termId="lot" />
          </ConceptHelp>
        </div>
        <span className={styles["muted"]}>
          <NumberText>{availableNotice(draft)}</NumberText>
        </span>
      </div>
      <div className={styles["stepper"]}>
        <TicketDraftLink
          draft={draft}
          name="lots"
          value={formatNumber(Math.max(smallestOrderLots, (count ?? 0) - 1))}
          label={m.trading_ticket_lots_down_label()}
          symbol="−"
        />
        <input
          id="ticket-lots"
          name="lots"
          inputMode="numeric"
          autoComplete="off"
          value={values.lots}
          onChange={(event) => {
            draft.change("lots", event.target.value, event.currentTarget.form);
          }}
          aria-invalid={
            values.lotsFailure !== undefined || rejection !== undefined
          }
          aria-describedby="ticket-lots-hint ticket-lots-failure"
        />
        <TicketDraftLink
          draft={draft}
          name="lots"
          value={formatNumber(Math.min(rules.maximumLots, (count ?? 0) + 1))}
          label={m.trading_ticket_lots_up_label()}
          symbol="+"
        />
      </div>
      <div className={styles["between"]}>
        <div className={styles["chips"]}>
          {([0.25, 0.5, 1] as const).map((fraction) => (
            <TicketDraftLink
              key={fraction}
              draft={draft}
              name="lots"
              value={formatNumber(draft.quickLots(fraction))}
              label={
                fraction === 1
                  ? m.trading_ticket_max_label()
                  : formatPercent(fraction)
              }
              className={styles["chip"]}
            />
          ))}
        </div>
        <span id="ticket-lots-hint" className={styles["muted"]}>
          {count !== undefined && (
            <NumberText>
              {shareCount(shares(count * rules.lotShares))}
            </NumberText>
          )}
        </span>
      </div>
      <div id="ticket-lots-failure">
        {values.lotsFailure !== undefined && (
          <p role="alert" className={styles["issue"]}>
            {values.lotsFailure}
          </p>
        )}
        {rejection !== undefined && (
          <div role="alert" className={styles["issue"]}>
            <p>
              <NumberText>
                {m.trading_ticket_lots_error({
                  field: m.trading_lots_label(),
                  reason: rejection.text,
                })}
              </NumberText>
            </p>
            {rejection.lotsStep !== undefined && (
              <TicketDraftLink
                draft={draft}
                name="lots"
                value={formatNumber(rejection.lotsStep)}
                label={m.trading_lots_step_label({
                  lots: lotCount(rejection.lotsStep),
                })}
                className={styles["fix"]}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function availableNotice(draft: TicketDraft): string {
  switch (draft.side) {
    case "buy":
      return m.trading_ticket_available_notice({
        cash: formatRupiah(draft.ticket.available),
      });
    case "sell":
      return m.trading_ticket_sellable_notice({
        lots: lotCount(draft.ticket.free),
      });
  }
}
