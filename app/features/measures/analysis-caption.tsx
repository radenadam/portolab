import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import type { AnalysisInsight } from "./analysis-insight";

const nameMarker = "\uE000student\uE001";

export function AnalysisCaption({
  insight,
  studentName,
}: {
  insight: (studentName: string | undefined) => AnalysisInsight;
  studentName?: string | undefined;
}): ReactNode {
  const caption = insight(studentName === undefined ? undefined : nameMarker);
  let parts: ReactNode[] = [caption.text];
  for (const number of new Set(caption.numbers))
    parts = replaceParts(parts, number, (key) => (
      <strong key={`${number}-${String(key)}`}>
        <NumberText whole>{number}</NumberText>
      </strong>
    ));
  if (studentName !== undefined)
    parts = replaceParts(parts, nameMarker, (key) => (
      <NumberText key={`name-${String(key)}`} verbatim>
        {studentName}
      </NumberText>
    ));
  return <span>{parts}</span>;
}

function replaceParts(
  parts: readonly ReactNode[],
  value: string,
  render: (key: number) => ReactNode,
): ReactNode[] {
  const next: ReactNode[] = [];
  for (const part of parts) {
    if (typeof part !== "string") {
      next.push(part);
      continue;
    }
    for (const [index, text] of part.split(value).entries()) {
      if (index > 0) next.push(render(next.length));
      next.push(text);
    }
  }
  return next;
}
