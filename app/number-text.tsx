import { Fragment } from "react";
import type { ReactNode } from "react";
import { numberPattern } from "./number-pattern";
import styles from "./number-text.module.css";

/** Formatted quantities keep their digits, sign, arrow, and unit together before JavaScript loads too. Names and identifiers can need to wrap. SVG text already stays on one line, so this renderer belongs only in HTML. */
export function NumberText({
  children,
  whole = false,
}: {
  children: ReactNode;
  whole?: boolean;
}): ReactNode {
  if (whole)
    return (
      <span className={styles["number"]} data-number="">
        {children}
      </span>
    );
  return numberTextOf(children);
}

function numberTextOf(value: ReactNode): ReactNode {
  if (Array.isArray(value))
    return value.map((part: ReactNode) => numberTextOf(part));
  if (typeof value !== "string" && typeof value !== "number") return value;
  const text = String(value);
  const parts: ReactNode[] = [];
  let start = 0;
  for (const part of text.matchAll(numberPattern)) {
    parts.push(
      <Fragment key={part.index}>
        {text.slice(start, part.index)}
        <span className={styles["number"]} data-number="">
          {part[0]}
        </span>
      </Fragment>,
    );
    start = part.index + part[0].length;
  }
  if (start === 0) return text;
  parts.push(text.slice(start));
  // A label stays one flex item, so its words keep their spaces around the numeric spans.
  return <span data-number-text="">{parts}</span>;
}
