/** A length or a position on the screen in CSS pixels, such as where a chart draws a point. Its own type keeps it apart from the betas and the returns that a chart places. */
export type Pixels = number & { readonly brand: "Pixels" };

function isPixels(value: number): value is Pixels {
  return Number.isFinite(value);
}

/** Makes a length that the program computed or the browser measured into pixels. A chart computes every length from the finite size of its frame and from finite measures, so a value that is not finite is a defect. */
export function pixels(value: number): Pixels {
  if (!isPixels(value)) {
    throw new Error(`${String(value)} is not a length in pixels.`);
  }
  return value;
}
