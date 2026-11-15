import type { BasisPoints } from "~/units/basis-points";
import { rupiah } from "~/units/rupiah";
import type { ReactNode } from "react";
import { ConceptHelp } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { formatPercent, formatRupiah, formatSignedRupiah } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { basisPointsPerWhole } from "~/units/basis-points";
import { lotCount } from "./count-parts";
import type { TicketDraft } from "./use-ticket-draft";
import type { OrderSide } from "./order";
import styles from "./ticket.module.css";

export function TicketBreakdown({ draft }: { draft: TicketDraft }): ReactNode {
  const { side, count, price, amounts, ticket } = draft;
  const { rates } = ticket.day.value;
  const sides: Record<
    OrderSide,
    { rate: BasisPoints; feeSign: 1 | -1; label: () => string }
  > = {
    buy: {
      rate: rates.buyFee,
      feeSign: 1,
      label: m.trading_ticket_paid_label,
    },
    sell: {
      rate: rates.sellFee,
      feeSign: -1,
      label: m.trading_ticket_received_label,
    },
  };
  if (amounts === undefined || count === undefined || price === undefined)
    return null;
  return (
    <section className={styles["section"]}>
      <div className={styles["label"]}>
        {m.trading_ticket_breakdown_title()}
        <ConceptHelp title={m.trading_ticket_breakdown_title()}>
          <p>{m.trading_ticket_costs_body()}</p>
          <ConceptLesson termId="biaya-broker" />
        </ConceptHelp>
      </div>
      <dl className={styles["breakdown"]}>
        <dt>
          <NumberText>
            {m.trading_ticket_value_label({
              lots: lotCount(count),
              price: formatRupiah(price),
            })}
          </NumberText>
        </dt>
        <dd>
          <NumberText>{formatRupiah(amounts.value)}</NumberText>
        </dd>
        <dt>
          <NumberText>
            {m.trading_ticket_fee_label({
              rate: formatPercent(sides[side].rate / basisPointsPerWhole),
            })}
          </NumberText>
        </dt>
        <dd>
          <NumberText>
            {formatSignedRupiah(rupiah(sides[side].feeSign * amounts.fee)).text}
          </NumberText>
        </dd>
        {side === "sell" && (
          <>
            <dt>
              <NumberText>
                {m.trading_ticket_tax_label({
                  rate: formatPercent(rates.salesTax / basisPointsPerWhole),
                })}
              </NumberText>
            </dt>
            <dd>
              <NumberText>
                {formatSignedRupiah(rupiah(0 - amounts.tax)).text}
              </NumberText>
            </dd>
          </>
        )}
        <dt className={styles["total"]}>{sides[side].label()}</dt>
        <dd className={styles["total"]}>
          <NumberText>{formatRupiah(amounts.total)}</NumberText>
        </dd>
        <dt>{m.trading_ticket_after_label()}</dt>
        <dd data-negative={amounts.after < 0}>
          <NumberText>{formatRupiah(amounts.after)}</NumberText>
        </dd>
      </dl>
    </section>
  );
}
