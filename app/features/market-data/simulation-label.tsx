import type { ReactNode } from "react";
import { formatMinutes } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import styles from "./simulation-badge.module.css";

/** An introductory illustration needs the same simulation facts without a control that opens the price update card. */
export function SimulationLabel({
  delayMinutes,
  full = false,
}: {
  delayMinutes: number;
  full?: boolean;
}): ReactNode {
  const delay = formatMinutes(delayMinutes, "short");
  const label = m.market_data_simulation_badge_label({ delay });
  return (
    <>
      <span className={styles["dot"]} />
      {full ? (
        <NumberText>{label}</NumberText>
      ) : (
        <>
          <span className={styles["long"]}>
            <NumberText>{label}</NumberText>
          </span>
          <span className={styles["short"]}>
            <NumberText>
              {m.market_data_short_simulation_badge_label({ delay })}
            </NumberText>
          </span>
        </>
      )}
    </>
  );
}
