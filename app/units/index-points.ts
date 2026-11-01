/** A level of an index, such as the IHSG, in points. Points are not money, so a level is never rupiah. */
export type IndexPoints = number & { readonly brand: "IndexPoints" };

/** Whether a number from outside the program can be the level of an index, which is a positive finite number. */
export function isIndexPoints(value: number): value is IndexPoints {
  return Number.isFinite(value) && value > 0;
}

/** Makes a level that the program itself holds, such as a constant, into index points. Outside data goes through isIndexPoints instead, which never throws. */
export function indexPoints(level: number): IndexPoints {
  if (!isIndexPoints(level)) {
    throw new Error(`${String(level)} is not the level of an index.`);
  }
  return level;
}
