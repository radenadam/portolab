import type { ReactNode } from "react";
import chipStyles from "~/chip.module.css";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { formatMinutes } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { Popover, PopoverButton } from "~/popover";
import type { SimulationBadgeData } from "./read-simulation-badge.server";
import styles from "./simulation-badge.module.css";

const cardId = "simulation-card";

/** The badge of the top bar that labels every result as a simulation and says that prices are delayed, as decision 0028 sets. It opens a card that explains both, gives the time of the latest price, and names the prices that the latest update missed. A page without the data of the frame, such as the page of a form that another site sent, shows the label of the simulation alone. */
export function SimulationBadge({
  badge,
}: {
  badge: SimulationBadgeData | undefined;
}): ReactNode {
  const chip = [chipStyles["chip"], chipStyles["warning"]].join(" ");
  if (badge === undefined) {
    return (
      <span className={chip}>
        <span className={styles["dot"]} />
        {m.market_data_simulation_name()}
      </span>
    );
  }
  const delay = formatMinutes(badge.delayMinutes, "short");
  return (
    <>
      <PopoverButton popover={cardId} className={chip}>
        <span className={styles["dot"]} />
        <span className={styles["long"]}>
          {m.market_data_simulation_badge_label({ delay })}
        </span>
        <span className={styles["short"]}>
          {m.market_data_short_simulation_badge_label({ delay })}
        </span>
        <span aria-hidden="true">?</span>
      </PopoverButton>
      <Popover
        id={cardId}
        label={m.market_data_simulation_title()}
        placement="belowEnd"
      >
        <div className={styles["card"]}>
          <p className={styles["title"]}>{m.market_data_simulation_title()}</p>
          {badge.card.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>
            <ConceptLesson termId="harga-tertunda" />
          </p>
        </div>
      </Popover>
    </>
  );
}
