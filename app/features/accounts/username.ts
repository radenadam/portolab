import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { listOfWords } from "../../sentences.ts";
import { describeValue } from "../../value-shapes.ts";

/** The name that a person signs in with, in lowercase. */
export type Username = string & { readonly brand: "Username" };

const usernameLength = { minimum: 3, maximum: 32 } as const;

/** The characters of a username: two ranges of letters and digits, and the symbols that join its words. Each text that states the rule builds it from these. */
const usernameCharacters = {
  ranges: [
    ["a", "z"],
    ["0", "9"],
  ],
  symbols: [".", "-", "_"],
} as const;

/** Puts what a person typed as a username into the form that Portolab stores. A username ignores case and the spaces around it, because a phone keyboard often capitalizes the first letter. */
export function normalizeUsername(text: string): string {
  return text.trim().toLowerCase();
}

/** Whether a normalized text is a username that Portolab accepts. */
export function isUsername(text: string): text is Username {
  if (
    text.length < usernameLength.minimum ||
    text.length > usernameLength.maximum
  ) {
    return false;
  }
  for (const character of text) {
    if (!isUsernameCharacter(character)) {
      return false;
    }
  }
  return true;
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
  const characters = listOfWords([
    ...usernameCharacters.ranges.map(([first, last]) => `${first} to ${last}`),
    ...usernameCharacters.symbols.map((symbol) => `"${symbol}"`),
  ]);
  return fail(
    `${source} must be ${String(usernameLength.minimum)} to ${String(usernameLength.maximum)} characters from ${characters}, but it is ${describeValue(value)}.`,
  );
}

function isUsernameCharacter(character: string): boolean {
  for (const [first, last] of usernameCharacters.ranges) {
    if (character >= first && character <= last) {
      return true;
    }
  }
  return usernameCharacters.symbols.some((symbol) => symbol === character);
}
