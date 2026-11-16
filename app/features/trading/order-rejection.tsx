import type { ReactNode } from "react";
import { ConceptHelp } from "~/concept-card";
import { MarketTime } from "~/market-time";
import { Message } from "~/message";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { fillFailureTexts } from "./order-failure-text";
import type { StoredOrder } from "./order-rows";
import type { PortfolioKind } from "./portfolio-store.server";
import styles from "./activity.module.css";

/** The line of a rejected order in a list of orders, whose explanation opens in place, as the standard of AGENTS.md about errors sets for a list of outcomes. */
export function OrderRejection({
  rejection,
  readOnly,
  portfolioKind,
}: {
  rejection: Extract<StoredOrder["state"], { kind: "rejected" }>;
  readOnly: boolean;
  portfolioKind: PortfolioKind;
}): ReactNode {
  const texts = fillFailureTexts(rejection.failure, portfolioKind);
  // The texts address the owner, so the lecturer reads them as quotes of what the student reads.
  const quoted = (text: string): ReactNode => {
    const value = <NumberText>{text}</NumberText>;
    return readOnly ? <q>{value}</q> : value;
  };
  const title = m.trading_activity_rejection_title();
  return (
    <div className={styles["rejection"]}>
      <p>
        <Message
          text={m.trading_activity_rejection_notice}
          values={{
            time: <MarketTime moment={rejection.rejectedAt} />,
            reason: quoted(texts.summary),
          }}
        />
      </p>
      <ConceptHelp title={title} label={title}>
        <p>
          <Message
            text={m.trading_activity_rejection_check_notice}
            values={{ quotedTime: <MarketTime moment={rejection.quotedAt} /> }}
          />
        </p>
        <p>{quoted(texts.details)}</p>
      </ConceptHelp>
    </div>
  );
}
