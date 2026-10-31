import { fail, succeed } from "~/result";
import type { Result } from "~/result";

/** Reads the path to send the reader back to. A path that could lead to another site fails, so a forged link never redirects the reader away. */
export function parseReturnPath(
  value: unknown,
  source: string,
): Result<string, string> {
  if (typeof value !== "string") {
    return fail(`${source} is missing from the form.`);
  }
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fail(
      `${source} must be a path on this site, such as /prices, but it is "${value}".`,
    );
  }
  return succeed(value);
}
