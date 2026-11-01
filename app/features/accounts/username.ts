import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue } from "../../value-shapes.ts";

/** The name that a person signs in with, in lowercase. */
export type Username = string & { readonly brand: "Username" };

// The failure text of parseUsername and the messages accounts_username_hint and accounts_username_error state these limits and characters, so a change here changes them too.
export const usernameLength = { minimum: 3, maximum: 32 } as const;
const usernamePattern = /^[a-z0-9._-]+$/;

/** Puts what a person typed as a username into the form that Portolab stores. A username ignores case and the spaces around it, because a phone keyboard often capitalizes the first letter. */
export function normalizeUsername(text: string): string {
  return text.trim().toLowerCase();
}

/** Whether a normalized text is a username that Portolab accepts. */
export function isUsername(text: string): text is Username {
  return (
    text.length >= usernameLength.minimum &&
    text.length <= usernameLength.maximum &&
    usernamePattern.test(text)
  );
}

/** Reads a username from a command line, where the failure is for the person who runs the server. */
export function parseUsername(
  value: unknown,
  source: string,
): Result<Username, string> {
  if (typeof value === "string") {
    const normalized = normalizeUsername(value);
    if (isUsername(normalized)) {
      return succeed(normalized);
    }
  }
  return fail(
    `${source} must be ${String(usernameLength.minimum)} to ${String(usernameLength.maximum)} characters from a to z, 0 to 9, ".", "-", and "_", but it is ${describeValue(value)}.`,
  );
}
