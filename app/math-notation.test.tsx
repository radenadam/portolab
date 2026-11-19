import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { expect, test } from "vitest";
import {
  Average,
  ConditionSeparator,
  Formula,
  Fraction,
  InlineMath,
  MathNumber,
  MathWord,
  Operand,
  Operator,
  Parenthesized,
  SquareRoot,
  Squared,
  Sum,
  Variable,
  sumLines,
} from "./math-notation";
import { withoutClassNamesForTest } from "./without-class-names-for-test";

function render(part: ReactNode): string {
  return withoutClassNamesForTest(renderToStaticMarkup(part));
}

test("writes a formula of one line as one row of MathML in display style, with its spreadsheet function as small text after the notation", () => {
  expect(
    render(
      <Formula
        left={<Variable name="y" index="p" />}
        right={
          <Fraction
            numerator={<Variable name="x" index="ip" />}
            denominator={<Variable name="z" index="p" power={2} />}
          />
        }
        spreadsheetFunction="QUOTIENT"
      />,
    ),
  ).toBe(
    [
      '<span><math displaystyle="true"><mrow>',
      "<msub><mi>y</mi><mi>p</mi></msub>",
      "<mo>=</mo>",
      "<mfrac>",
      "<mrow><msub><mi>x</mi><mrow><mi>i</mi><mi>p</mi></mrow></msub></mrow>",
      "<mrow><msubsup><mi>z</mi><mi>p</mi><mn>2</mn></msubsup></mrow>",
      "</mfrac>",
      "</mrow></math> <small>(QUOTIENT)</small></span>",
    ].join(""),
  );
});

test("aligns the lines of a formula at their operators in a table whose rows hold the left side, the operator, and the expression", () => {
  expect(
    render(
      <Formula
        left={<Variable name="σ" index="i" />}
        right={
          <SquareRoot>
            <Variable name="σ" index="i" power={2} />
          </SquareRoot>
        }
        followingLines={[
          {
            operator: "=",
            expression: (
              <SquareRoot>
                <MathNumber>0,002732</MathNumber>
              </SquareRoot>
            ),
          },
        ]}
      />,
    ),
  ).toBe(
    [
      '<span><math displaystyle="true"><mtable displaystyle="true">',
      "<mtr><mtd><msub><mi>σ</mi><mi>i</mi></msub></mtd><mtd><mo>=</mo></mtd>",
      "<mtd><msqrt><msubsup><mi>σ</mi><mi>i</mi><mn>2</mn></msubsup></msqrt></mtd></mtr>",
      "<mtr><mtd></mtd><mtd><mo>=</mo></mtd><mtd><msqrt><mn>0,002732</mn></msqrt></mtd></mtr>",
      "</mtable></math></span>",
    ].join(""),
  );
});

test("makes a formula that scrolls on a phone a stop of the Tab key, and no other formula", () => {
  const formula = (scrolls: boolean): string =>
    render(
      <Formula
        left={<Variable name="x" />}
        right={<MathNumber>1</MathNumber>}
        scrolls={scrolls}
      />,
    );
  expect(formula(true)).toBe(
    '<span tabindex="0"><math displaystyle="true"><mrow><mi>x</mi><mo>=</mo><mn>1</mn></mrow></math></span>',
  );
  expect(formula(false)).toBe(
    '<span><math displaystyle="true"><mrow><mi>x</mi><mo>=</mo><mn>1</mn></mrow></math></span>',
  );
});

test("writes a letter alone, with a square, and with a subscript, each as the element of MathML for its scripts", () => {
  expect(
    render(
      <InlineMath>
        <Variable name="n" />
        <Variable name="x" power={2} />
        <Variable name="R" index="f" />
      </InlineMath>,
    ),
  ).toBe(
    "<math><mi>n</mi><msup><mi>x</mi><mn>2</mn></msup><msub><mi>R</mi><mi>f</mi></msub></math>",
  );
});

test("puts a negative number after an operator in parentheses and leaves a positive one bare", () => {
  expect(
    render(
      <InlineMath>
        <Operand value={-0.0028} text="-0,28%" operator="−" />
        <Operand value={0.0048} text="0,48%" operator="+" />
        <Operand value={-0.52} text="-0,52" />
      </InlineMath>,
    ),
  ).toBe(
    [
      "<math>",
      "<mo>−</mo><mrow><mo>(</mo><mn>-0,28%</mn><mo>)</mo></mrow>",
      "<mo>+</mo><mn>0,48%</mn>",
      "<mrow><mo>(</mo><mn>-0,52</mn><mo>)</mo></mrow>",
      "</math>",
    ].join(""),
  );
});

test("writes a sum with the subject below its sign, a mean with a bar, a word, a square of a group, an operator, and the comma before a condition", () => {
  expect(
    render(
      <InlineMath>
        <Sum over="i" />
        <Sum />
        <Average name="σ" />
        <MathWord>BI-Rate</MathWord>
        <Squared>
          <Parenthesized>
            <Variable name="x" />
          </Parenthesized>
        </Squared>
        <Operator symbol="×" />
        <ConditionSeparator />
      </InlineMath>,
    ),
  ).toBe(
    [
      "<math>",
      "<munder><mo>∑</mo><mi>i</mi></munder>",
      "<mo>∑</mo>",
      '<mover accent="true"><mi>σ</mi><mo>¯</mo></mover>',
      "<mtext>BI-Rate</mtext>",
      "<msup><mrow><mrow><mo>(</mo><mi>x</mi><mo>)</mo></mrow></mrow><mn>2</mn></msup>",
      "<mo>×</mo>",
      '<mo>,</mo><mspace width="1em"></mspace>',
      "</math>",
    ].join(""),
  );
});

test("puts the given number of terms of a sum on each line, starts the first line with its operator, and continues each later line with a plus", () => {
  const terms = ["a", "b", "c", "d", "e"].map((name) => ({
    key: name,
    term: <Variable name={name} />,
  }));
  const lines = sumLines("≈", terms, 2);
  expect(lines.map((line) => line.operator)).toEqual(["≈", "+", "+"]);
  expect(
    lines.map((line) => render(<InlineMath>{line.expression}</InlineMath>)),
  ).toEqual([
    "<math><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow></math>",
    "<math><mrow><mi>c</mi><mo>+</mo><mi>d</mi></mrow></math>",
    "<math><mrow><mi>e</mi></mrow></math>",
  ]);
});
