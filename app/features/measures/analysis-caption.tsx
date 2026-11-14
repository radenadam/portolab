import type { ReactNode } from "react";
import type { AnalysisInsight } from "./analysis-insight";
import styles from "./analysis.module.css";

export function AnalysisCaption({
  insight,
}: {
  insight: AnalysisInsight;
}): ReactNode {
  let parts: ReactNode[] = [insight.text];
  for (const number of new Set(insight.numbers)) {
    const next: ReactNode[] = [];
    for (const part of parts) {
      next.push(...splitNumber(part, number, next.length));
    }
    parts = next;
  }
  return <span>{parts}</span>;
}

function splitNumber(
  part: ReactNode,
  number: string,
  startKey: number,
): ReactNode[] {
  if (typeof part !== "string") return [part];
  const parts: ReactNode[] = [];
  for (const [index, text] of part.split(number).entries()) {
    if (index > 0)
      parts.push(
        <strong
          className={styles["number"]}
          key={`${number}-${String(startKey + parts.length)}`}
        >
          {number}
        </strong>,
      );
    parts.push(text);
  }
  return parts;
}
