/** The change from one price to a later one as a fraction, such as 0.0081 for a rise of 0.81%, which is the return between the two prices. */
export function priceChange(later: number, earlier: number): number {
  return later / earlier - 1;
}
