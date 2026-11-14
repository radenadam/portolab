/** The smallest and the largest value that an axis of a chart shows. */
export interface Range<Value extends number> {
  min: Value;
  max: Value;
}

// A point at the edge of the values keeps a part of the range between it and the edge of the plot, and values without any spread, such as returns that never changed, still need a range to lie in.
const rangePadding = 0.08;
const emptyRangePadding = 0.005;

/** Padding leaves room for marks and labels, and a lower bound keeps the scale within its unit. */
export function paddedRange<Value extends number>(
  values: readonly Value[],
  toValue: (value: number) => Value,
  {
    paddingShare = rangePadding,
    minimum,
  }: { paddingShare?: number | undefined; minimum?: Value | undefined } = {},
): Range<Value> {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = max > min ? (max - min) * paddingShare : emptyRangePadding;
  return {
    min: toValue(Math.max(minimum ?? -Infinity, min - padding)),
    max: toValue(max + padding),
  };
}

/** Where a value lies in a range, as a fraction from 0 at its smallest value to 1 at its largest. */
export function fractionOf<Value extends number>(
  range: Range<Value>,
  value: Value,
): number {
  return (value - range.min) / (range.max - range.min);
}

/** The round values in a range for about a number of marks of an axis: the multiples of a step of 1, 2, or 5 times a power of ten, so a reader reads the scale at a glance. The step is never finer than the smallest step that the format of the texts of the marks writes apart, such as smallestPercentStep, so no two marks read the same. */
export function niceTicks<Value extends number>(
  range: Range<Value>,
  marks: { count: number; smallestStep: number },
  toValue: (value: number) => Value,
): Value[] {
  const { count, smallestStep } = marks;
  const roughStep = Math.max((range.max - range.min) / count, smallestStep);
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const step =
    [1, 2, 5]
      .map((multiple) => multiple * power)
      .find((candidate) => candidate >= roughStep) ?? 10 * power;
  const ticks: Value[] = [];
  for (
    let index = Math.ceil(range.min / step);
    index * step <= range.max;
    index += 1
  ) {
    // Math.ceil gives -0 for a value just below zero, which Intl writes as -0.
    ticks.push(toValue(index === 0 ? 0 : index * step));
  }
  return ticks;
}
