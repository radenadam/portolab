import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { describeValue } from "~/value-shapes";

/** Reads the path to send the reader back to. A value that leads to another site fails, so a forged link never redirects the reader away. */
export function parseReturnPath(
  value: unknown,
  source: string,
  siteOrigin: string,
): Result<string, string> {
  if (value === null || value === undefined) {
    return fail(`${source} is missing from the form.`);
  }
  if (typeof value !== "string") {
    return fail(`${source} must be text, but it is ${describeValue(value)}.`);
  }
  // The URL parser resolves the value the way a browser does, so a value that only looks like a local path, such as one with a tab after its slash, still fails.
  const url = URL.parse(value, siteOrigin);
  if (url?.origin === siteOrigin) {
    const path = `${url.pathname}${url.search}${url.hash}`;
    // A value such as "/.//example.com" normalizes to "//example.com", which a browser reads as another site, so the returned path must resolve to this site too.
    if (URL.parse(path, siteOrigin)?.origin === siteOrigin) {
      return succeed(path);
    }
  }
  return fail(
    `${source} must be a path on this site, such as /prices, but it is ${describeValue(value)}.`,
  );
}
