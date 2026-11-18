import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { lotCount } from "~/features/trading/count-parts";
import type { OrderSide } from "~/features/trading/order";
import { formatMarketTime } from "~/formatting";
import { Avatar } from "~/avatar";
import { m } from "~/paraglide/messages.js";
import type { StudentPanelData } from "./student-panel-data.server";
import styles from "./grading.module.css";

export function LatestStudentReason({
  name,
  reason,
}: {
  name: string;
  reason: StudentPanelData["reason"];
}): ReactNode {
  return (
    <section className={styles["latestReason"]}>
      <Avatar name={name} look="plain" className={styles["avatar"]} />
      <div>
        <h2>
          {m.grading_latest_reason_title()}
          {reason !== undefined && (
            <>
              {" "}
              <small>
                <NumberText>{heading(reason)}</NumberText>
              </small>
            </>
          )}
        </h2>
        {reason === undefined ? (
          <p>{m.grading_no_reason_body()}</p>
        ) : (
          <q className={styles["quote"]}>
            <NumberText verbatim>{reason.reason}</NumberText>
          </q>
        )}
      </div>
    </section>
  );
}

function heading(reason: NonNullable<StudentPanelData["reason"]>): string {
  const inputs = {
    code: reason.code,
    lots: lotCount(reason.lots),
    time: formatMarketTime(reason.filledAt),
  };
  const headings: Record<OrderSide, () => string> = {
    buy: () => m.grading_latest_purchase_notice(inputs),
    sell: () => m.grading_latest_sale_notice(inputs),
  };
  return headings[reason.side]();
}
