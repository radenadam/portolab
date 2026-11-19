import { Fragment, useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { NumberText } from "./number-text";
import styles from "./math-notation.module.css";

// Decision 0070 explains why a formula is MathML, which each browser typesets in the math font of the device.

/** The operator at the start of a line of a formula: a relation, or a plus that continues the sum of the line before it. */
type LineOperator = "=" | "≈" | "+";

/** A line of a formula: the operator at its start and the expression after it. */
export interface FormulaLine {
  operator: LineOperator;
  expression: ReactNode;
}

const noFollowingLines: readonly FormulaLine[] = [];

/** A formula of the course: its left side, what equals it, the lines that follow, such as the same expression with the numbers in it, and the spreadsheet function that gives its value, which follows the notation as small text. A formula with several lines aligns them at their operators, as the aligned environment of LaTeX does. A formula that is wider than its column first puts its spreadsheet function on a line of its own, then shrinks, and scrolls sideways inside its own box only when it is still too wide, as decision 0070 sets. A formula that scrolls is a stop of the Tab key, so a keyboard can scroll it, and one whose numbers can be that wide on a phone is a stop before JavaScript loads too. */
export function Formula({
  left,
  right,
  followingLines = noFollowingLines,
  spreadsheetFunction,
  scrolls = false,
}: {
  left: ReactNode;
  right: ReactNode;
  followingLines?: readonly FormulaLine[];
  spreadsheetFunction?: string | undefined;
  scrolls?: boolean;
}): ReactNode {
  const { boxRef, overflows } = useFormulaFit();
  const lines: FormulaLine[] = [
    { operator: "=", expression: right },
    ...followingLines,
  ];
  return (
    <span
      ref={boxRef}
      className={styles["formula"]}
      // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex -- A keyboard reaches a box that scrolls only through a stop of the Tab key.
      tabIndex={scrolls || overflows ? 0 : undefined}
    >
      <math displaystyle="true">
        {followingLines.length === 0 ? (
          <mrow>
            {left}
            <mo>=</mo>
            {right}
          </mrow>
        ) : (
          <mtable displaystyle="true">
            {lines.map((line, index) => (
              // eslint-disable-next-line @eslint-react/no-array-index-key -- The lines of a formula never change their order.
              <mtr key={index}>
                <mtd>{index === 0 ? left : null}</mtd>
                <mtd>
                  <mo>{line.operator}</mo>
                </mtd>
                <mtd>{line.expression}</mtd>
              </mtr>
            ))}
          </mtable>
        )}
      </math>
      {spreadsheetFunction !== undefined && (
        <>
          {/* The flex box of the formula sets the gap, and the space keeps the function apart from the notation in copied text. */}{" "}
          <small className={styles["function"]}>({spreadsheetFunction})</small>
        </>
      )}
    </span>
  );
}

// A formula shrinks to three quarters of its size at most, which keeps its subscripts readable. A formula that is wider at that size scrolls.
const smallestFormulaScale = 0.75;

/** Shrinks a formula that is wider than its column, down to its smallest size, and tells whether it still overflows, once the app runs in the browser. Before that, a formula that is too wide scrolls. */
function useFormulaFit(): {
  boxRef: RefObject<HTMLSpanElement | null>;
  overflows: boolean;
} {
  const boxRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const box = boxRef.current;
    if (box === null) return undefined;
    const column = box.parentElement;
    const math = box.querySelector("math");
    if (column === null || math === null) return undefined;
    let isLive = true;
    const fit = (): void => {
      box.style.removeProperty("--formula-scale");
      const available = box.clientWidth;
      const width = math.getBoundingClientRect().width;
      // A formula in a closed part, such as a details or a popover, has no width until it opens, and the observer measures it again then.
      if (available === 0 || width === 0) return;
      const scale = Math.max(
        smallestFormulaScale,
        Math.min(1, available / width),
      );
      if (scale < 1) box.style.setProperty("--formula-scale", String(scale));
      setOverflows(box.scrollWidth > box.clientWidth + 1);
    };
    const observer = new ResizeObserver(fit);
    observer.observe(column);
    // Until the fonts load, the browser measures a formula in a fallback font, whose widths differ.
    void document.fonts.ready.then(() => {
      if (isLive) fit();
    });
    return () => {
      isLive = false;
      observer.disconnect();
    };
  }, []);
  return { boxRef, overflows };
}

/** A formula that stands on its own, outside a list of measures, with the sentence before it that says what it computes, so no formula appears without its meaning. A paragraph holds the formula, so its child is a Formula and never a block. */
export function ExplainedFormula({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className={styles["explained"]}>
      <p>
        <NumberText>{text}</NumberText>
      </p>
      <p>{children}</p>
    </div>
  );
}

/** Notation inside a sentence, such as the symbol of the rate free of risk. */
export function InlineMath({ children }: { children: ReactNode }): ReactNode {
  return <math>{children}</math>;
}

/** A letter of a formula with the subjects in its subscript, each a letter of its own, such as σ with i and M, and the square in its superscript. */
export function Variable({
  name,
  index,
  power,
}: {
  name: string;
  index?: string | undefined;
  power?: 2 | undefined;
}): ReactNode {
  const letter = <mi>{name}</mi>;
  const subjects = Array.from(index ?? "", (subject, position) => (
    <mi key={position}>{subject}</mi>
  ));
  const subscript = subjects.length > 1 ? <mrow>{subjects}</mrow> : subjects[0];
  const superscript = power === undefined ? undefined : <mn>2</mn>;
  if (subscript === undefined && superscript === undefined) return letter;
  if (superscript === undefined)
    return (
      <msub>
        {letter}
        {subscript}
      </msub>
    );
  if (subscript === undefined)
    return (
      <msup>
        {letter}
        {superscript}
      </msup>
    );
  return (
    <msubsup>
      {letter}
      {subscript}
      {superscript}
    </msubsup>
  );
}

/** A number as the formats of the language write it. */
export function MathNumber({ children }: { children: string }): ReactNode {
  return <mn>{children}</mn>;
}

/** An operator between two terms. */
export function Operator({
  symbol,
}: {
  symbol: "+" | "−" | "×" | "=";
}): ReactNode {
  return <mo>{symbol}</mo>;
}

/** A word inside a formula, such as BI-Rate. */
export function MathWord({ children }: { children: string }): ReactNode {
  return <mtext>{children}</mtext>;
}

export function Parenthesized({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <mrow>
      <mo>(</mo>
      {children}
      <mo>)</mo>
    </mrow>
  );
}

export function Fraction({
  numerator,
  denominator,
}: {
  numerator: ReactNode;
  denominator: ReactNode;
}): ReactNode {
  return (
    <mfrac>
      <mrow>{numerator}</mrow>
      <mrow>{denominator}</mrow>
    </mfrac>
  );
}

export function SquareRoot({ children }: { children: ReactNode }): ReactNode {
  return <msqrt>{children}</msqrt>;
}

export function Squared({ children }: { children: ReactNode }): ReactNode {
  return (
    <msup>
      <mrow>{children}</mrow>
      <mn>2</mn>
    </msup>
  );
}

/** The sign of a sum, with the subject that it runs over below it, or beside it in a line of text. */
export function Sum({ over }: { over?: string | undefined }): ReactNode {
  if (over === undefined) return <mo>∑</mo>;
  return (
    <munder>
      <mo>∑</mo>
      <mi>{over}</mi>
    </munder>
  );
}

/** A letter with a bar, which stands for an average. */
export function Average({ name }: { name: string }): ReactNode {
  return (
    <mover accent="true">
      <mi>{name}</mi>
      <mo>¯</mo>
    </mover>
  );
}

/** The comma and the space that set a condition apart from the expression before it, such as n = 60 after a mean. */
export function ConditionSeparator(): ReactNode {
  return (
    <>
      <mo>,</mo>
      <mspace width="1em" />
    </>
  );
}

/** A number after an operator, which stands in parentheses when it is negative, so its sign never reads as a second operator, as decision 0020 sets. */
export function Operand({
  value,
  text,
  operator,
}: {
  value: number;
  text: string;
  operator?: "+" | "−" | "×" | undefined;
}): ReactNode {
  const number = <mn>{text}</mn>;
  return (
    <>
      {operator !== undefined && <mo>{operator}</mo>}
      {value < 0 ? <Parenthesized>{number}</Parenthesized> : number}
    </>
  );
}

/** The terms of a sum in lines of a formula, a few on each line, so a sum of many terms stays as narrow as a phone. The first line starts with the operator that the formula gives it, and each later line continues the sum with a plus. */
export function sumLines(
  operator: LineOperator,
  terms: readonly { key: string; term: ReactNode }[],
  termsPerLine: number,
): FormulaLine[] {
  const lines: FormulaLine[] = [];
  for (let start = 0; start < terms.length; start += termsPerLine) {
    const lineTerms = terms.slice(start, start + termsPerLine);
    lines.push({
      operator: start === 0 ? operator : "+",
      expression: (
        <mrow>
          {lineTerms.map((term, position) => (
            <Fragment key={term.key}>
              {position > 0 && <mo>+</mo>}
              {term.term}
            </Fragment>
          ))}
        </mrow>
      ),
    });
  }
  return lines;
}
