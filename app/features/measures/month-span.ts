import { formatMonth } from "~/formatting";
import type { ReturnMeasure } from "./aligned-returns";
import { monthlyReturnCount } from "./monthly-return-count";

/** The monthly returns that a set of measures uses: how many, and the last trading days of the months of the first and of the last of them. */
export interface MonthSpan {
  count: number;
  first: string;
  last: string;
}

/** The months of monthly returns, oldest first. */
export function monthSpanOf(returns: readonly ReturnMeasure[]): MonthSpan {
  const first = returns.at(0);
  const last = returns.at(-1);
  // The measures need at least two returns, so measures without any are a defect.
  if (first === undefined || last === undefined) {
    throw new Error(
      "Measures always have monthly returns, but these have none.",
    );
  }
  return {
    count: returns.length,
    first: first.inputs.endDate,
    last: last.inputs.endDate,
  };
}

/** The inputs of a text that names the months of measures: the number of returns with its noun, and the first and the last month in words. */
export function monthSpanInputs(span: MonthSpan): {
  returns: string;
  first: string;
  last: string;
} {
  return {
    returns: monthlyReturnCount(span.count),
    first: formatMonth(span.first),
    last: formatMonth(span.last),
  };
}
