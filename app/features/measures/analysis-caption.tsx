import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import type { AnalysisInsight } from "./analysis-insight";

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
        <strong key={`${number}-${String(startKey + parts.length)}`}>
          <NumberText whole>{number}</NumberText>
        </strong>,
      );
    parts.push(text);
  }
  return parts;
}
