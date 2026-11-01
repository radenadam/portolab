import { parseUsername } from "./username";
import type { Username } from "./username";

/** Reads a username that a test writes, and fails the test when the text is no username. */
export function usernameForTest(text: string): Username {
  const username = parseUsername(text, "The username of the test");
  if (!username.ok) {
    throw new Error(username.failure);
  }
  return username.value;
}
