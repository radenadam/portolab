import { fail, succeed } from "~/result";
import type { Result } from "~/result";

/** Reads the path to send the reader back to. A value that leads to another site fails, so a forged link never redirects the reader away. */
export function parseReturnPath(
  value: unknown,
  source: string,
  siteOrigin: string,
): Result<string, string> {
  if (typeof value !== "string") {
    return fail(`${source} is missing from the form.`);
  }
  // The URL parser resolves the value the way a browser does, so a value that only looks like a local path, such as one with a tab after its slash, still fails.
  const url = URL.parse(value, siteOrigin);
  if (url?.origin !== siteOrigin) {
    return fail(
      `${source} must be a path on this site, such as /prices, but it is "${value}".`,
    );
  }
  return succeed(`${url.pathname}${url.search}${url.hash}`);
}
