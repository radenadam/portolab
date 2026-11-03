/** A path of a step, such as the sign-in page, that returns to another path when it is done. */
export function pathReturningTo(path: string, returnPath: string): string {
  return `${path}?${new URLSearchParams({ returnTo: returnPath }).toString()}`;
}
