/** Stable ties keep a student's identity consistent between the map and teaching cards. */
export function extremeOf<Item>(
  items: readonly Item[],
  valueOf: (item: Item) => number | undefined,
  highest: boolean,
): Item | undefined {
  let best: { item: Item; value: number } | undefined;
  for (const item of items) {
    const value = valueOf(item);
    if (
      value !== undefined &&
      (best === undefined ||
        (highest ? value > best.value : value < best.value))
    )
      best = { item, value };
  }
  return best?.item;
}
