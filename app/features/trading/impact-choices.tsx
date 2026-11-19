import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { ViewLink } from "~/view-link";
import { pathWithQuery } from "~/path-with-query";
import styles from "./trade-impact.module.css";

/** Native links return to the comparison that they change, including inside the ticket. */
export function ImpactChoices<Choice extends string | number>({
  choices,
  selected,
  label,
  name,
  field,
  anchor,
}: {
  choices: readonly Choice[];
  selected: Choice;
  label: string;
  name: (choice: Choice) => string;
  field: "impact" | "impactAxis";
  anchor: "impact" | "ticket-impact";
}): ReactNode {
  const location = useLocation();
  return (
    <nav className={styles["segments"]} aria-label={label}>
      {choices.map((choice) => (
        <ViewLink
          key={choice}
          to={`${pathWithQuery(`${location.pathname}${location.search}`, { [field]: String(choice) })}#${anchor}`}
          aria-current={selected === choice ? "true" : undefined}
        >
          {name(choice)}
        </ViewLink>
      ))}
    </nav>
  );
}
