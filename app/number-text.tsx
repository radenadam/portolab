import { Fragment } from "react";
import type { ReactElement, ReactNode } from "react";
import { numberPattern } from "./number-pattern";
import styles from "./number-text.module.css";

type NumberTextValue =
  string | number | null | undefined | readonly NumberTextValue[];
type MarkedValue = string | ReactElement;
type TextValue = (value: MarkedValue) => string;
const textValuePattern = /\uE000(\d+)\uE001/gu;

/** Text-only children prevent silently skipping an element tree. A whole group may include an arrow. Names and identifiers remain text, and a callback marks them or an explicit whole group before a message joins them with quantities, so identical text cannot disguise a quantity. SVG text already stays on one line. */
export function NumberText(
  properties:
    | {
        children: NumberTextValue | ((textValue: TextValue) => NumberTextValue);
        whole?: false;
        verbatim?: false;
      }
    | { children: ReactNode; whole: true; verbatim?: false }
    | { children: string; whole?: false; verbatim: true },
): ReactNode {
  if (properties.whole === true)
    return (
      <span className={styles["number"]} data-number="">
        {properties.children}
      </span>
    );
  if (properties.verbatim === true)
    return (
      <span className={styles["textValue"]} data-text-value="">
        {properties.children}
      </span>
    );
  if (typeof properties.children !== "function")
    return numberTextOf(properties.children, []);
  const textValues: MarkedValue[] = [];
  const value = properties.children((text) => {
    const index = textValues.push(text) - 1;
    return `\uE000${String(index)}\uE001`;
  });
  return numberTextOf(value, textValues);
}

function numberTextOf(
  value: NumberTextValue,
  textValues: readonly MarkedValue[],
): ReactNode {
  const text = messageText(value);
  if (textValues.length === 0) return numberRuns(text);
  const parts: ReactNode[] = [];
  let start = 0;
  for (const match of text.matchAll(textValuePattern)) {
    const textValue = textValues[Number(match[1])];
    if (textValue === undefined)
      throw new Error("A text placeholder needs its original value.");
    parts.push(
      <Fragment key={match.index}>
        {numberRuns(text.slice(start, match.index))}
        {typeof textValue === "string" ? (
          <span className={styles["textValue"]} data-text-value="">
            {textValue}
          </span>
        ) : (
          textValue
        )}
      </Fragment>,
    );
    start = match.index + match[0].length;
  }
  parts.push(
    <Fragment key={text.length}>{numberRuns(text.slice(start))}</Fragment>,
  );
  return textGroup(parts);
}

function numberRuns(text: string): ReactNode {
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
  return textGroup(parts);
}

function textGroup(parts: readonly ReactNode[]): ReactNode {
  // A label stays one flex item, so its words keep their spaces around the numeric spans.
  return <span data-number-text="">{parts}</span>;
}

function messageText(value: NumberTextValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  let text = "";
  for (const part of value) text += messageText(part);
  return text;
}
