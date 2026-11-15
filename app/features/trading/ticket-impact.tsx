import { useMemo } from "react";
import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import type { TicketDraft } from "./use-ticket-draft";
import type { AnalysisAxis } from "~/features/measures/analysis-axes";
import { previewTrade } from "./preview-trade";
import { ImpactHeading, TradeImpact } from "./trade-impact";
import { ImpactQuoteTimes } from "./impact-quote-times";
import { unpricedImpactText } from "./stock-impact";
import styles from "./trade-impact.module.css";

export function TicketImpact({
  draft,
  code,
  axis,
}: {
  draft: TicketDraft;
  code: string;
  axis: AnalysisAxis | undefined;
}): ReactNode {
  const { count, price, ticket, side, values } = draft;
  const priceKind = values.priceKind;
  const preview = useMemo(
    () =>
      ticket.impact.ok && count !== undefined && price !== undefined
        ? previewTrade(
            ticket.impact.value,
            {
              code,
              side,
              lots: count,
              reason: undefined,
              placedAt: ticket.now,
              price:
                priceKind === "limit"
                  ? { kind: "limit", limit: price }
                  : { kind: "market" },
            },
            { day: ticket.day.value, quote: ticket.quote },
          )
        : undefined,
    [ticket, count, price, side, priceKind, code],
  );
  if (count === undefined || price === undefined) return null;
  return (
    <section
      id="ticket-impact"
      className={styles["ticket"]}
      aria-labelledby="ticket-title ticket-impact-title"
    >
      <ImpactHeading
        id="ticket-impact-title"
        months={ticket.impact.ok ? ticket.impact.value.months : undefined}
      />
      {ticket.impact.ok && (
        <ImpactQuoteTimes
          stocks={ticket.impact.value.stocks}
          quotedAt={ticket.quote.quotedAt}
        />
      )}
      {preview === undefined ? (
        !ticket.impact.ok && (
          <p>
            <NumberText>{unpricedImpactText(ticket.impact.failure)}</NumberText>
          </p>
        )
      ) : (
        <TradeImpact preview={preview} code={code} ticket axis={axis} />
      )}
    </section>
  );
}
