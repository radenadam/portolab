/** The code with which a student joins a class, in lowercase letters and digits without the hyphen that a page shows. */
export type JoinCode = string & { readonly brand: "JoinCode" };

// Eight characters of five bits carry 40 random bits, so guessing a code takes far more attempts than the limit on wrong codes allows.
export const joinCodeLength = 8;

/** Shows a code in two groups of four, such as k7qm-4rxt, which a person reads from a projector more easily. */
export function formatJoinCode(code: JoinCode): string {
  const half = joinCodeLength / 2;
  return `${code.slice(0, half)}-${code.slice(half)}`;
}
