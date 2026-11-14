import { Fragment } from "react";
import type { ReactNode } from "react";
import { numberPattern } from "./number-pattern";
import styles from "./number-text.module.css";

type NumberTextValue =
  string | number | null | undefined | readonly NumberTextValue[];

/** Text-only children prevent a wrapper from silently skipping an element tree. A whole group is explicit because it may include an arrow element. SVG text already stays on one line, so this renderer belongs only in HTML. */
export function NumberText(
  properties:
    | { children: NumberTextValue; whole?: false }
    | { children: ReactNode; whole: true },
): ReactNode {
  if (properties.whole === true)
    return (
      <span className={styles["number"]} data-number="">
        {properties.children}
      </span>
    );
  return numberTextOf(properties.children);
}

function numberTextOf(value: NumberTextValue): ReactNode {
  if (value === null || value === undefined) return value;
  if (typeof value !== "string" && typeof value !== "number")
    return value.map((part) => numberTextOf(part));
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
