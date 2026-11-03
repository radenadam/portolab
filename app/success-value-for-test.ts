import type { Result } from "./result.ts";

/** The value of a result that the test expects to succeed. A failure throws with the expectation and the failure, so the test names both. */
export function successValueForTest<Value, Failure>(
  result: Result<Value, Failure>,
  expectation: string,
): Value {
  if (!result.ok) {
    throw new Error(
      `${expectation}, but it failed with ${JSON.stringify(result.failure)}.`,
    );
  }
  return result.value;
}
