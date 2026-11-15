import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
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
        <Link
          key={choice}
          to={`${pathWithQuery(`${location.pathname}${location.search}`, { [field]: String(choice) })}#${anchor}`}
          preventScrollReset
          aria-current={selected === choice ? "true" : undefined}
        >
          <span>{name(choice)}</span>
        </Link>
      ))}
    </nav>
  );
}
