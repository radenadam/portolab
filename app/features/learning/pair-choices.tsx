import type { ReactNode } from "react";
import chipStyles from "~/chip.module.css";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import localStyles from "./trading-lesson.module.css";

export function PairChoices({
  label,
  holdings,
  chosen,
  other,
  select,
}: {
  label: string;
  holdings: PortfolioSummary["holdings"];
  chosen: string;
  /** The stock of the other side, which this side cannot choose too. */
  other: string;
  select: (code: string) => void;
}): ReactNode {
  return (
    <div className={localStyles["choices"]} role="group" aria-label={label}>
      <span>{label}</span>
      {holdings
        .filter((holding) => holding.code !== other)
        .map((holding) => (
          <button
            key={holding.code}
            type="button"
            className={[localStyles["choice"], chipStyles["filter"]].join(" ")}
            aria-pressed={chosen === holding.code}
            onClick={() => {
              select(holding.code);
            }}
          >
            <span>{holding.code}</span>
          </button>
        ))}
    </div>
  );
}
