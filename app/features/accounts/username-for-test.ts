import { successValueForTest } from "~/success-value-for-test";
import { parseUsername } from "./username";
import type { Username } from "./username";

/** Reads a username that a test writes, and fails the test when the text is no username. */
export function usernameForTest(text: string): Username {
  return successValueForTest(
    parseUsername(text, "The username of the test"),
    `The username ${text} is valid`,
  );
}
