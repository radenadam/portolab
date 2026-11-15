/** A median keeps an extreme portfolio from dominating the class comparison. */
export function medianOf<Value extends number>(
  values: readonly Value[],
  toValue: (value: number) => Value,
): Value | undefined {
  const ordered = values.toSorted((first, second) => first - second);
  const middle = Math.floor(ordered.length / 2);
  const upper = ordered[middle];
  if (upper === undefined) return undefined;
  const lower = ordered[middle - 1];
  return ordered.length % 2 === 0 && lower !== undefined
    ? toValue((lower + upper) / 2)
    : upper;
}
