/** The change from the previous close to the last price as a fraction, such as 0.0081 for a rise of 0.81%. */
export function priceChange(last: number, previous: number): number {
  return last / previous - 1;
}
