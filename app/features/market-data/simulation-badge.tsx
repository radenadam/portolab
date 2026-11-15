import type { ReactNode } from "react";
import chipStyles from "~/chip.module.css";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { formatMinutes } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { Popover, PopoverButton } from "~/popover";
import type { SimulationBadgeData } from "./read-simulation-badge.server";
import styles from "./simulation-badge.module.css";

const cardId = "simulation-card";

/** The badge labels every result as a simulation with delayed prices. Without frame data, it keeps both facts visible because an error page still belongs to the simulation. */
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
        {m.market_data_simulation_fallback_label()}
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
