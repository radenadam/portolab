import { checkFieldLength } from "~/check-field-length";
import { returnPathMaximumLength } from "~/form-size";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { describeValue } from "~/value-shapes";

/** Reads the path to send the reader back to. A value that leads to another site fails, so a forged link never redirects the reader away. */
export function parseReturnPath(
  value: unknown,
  source: string,
  site: string | { origin: string; allowedPaths: readonly string[] },
): Result<string, string> {
  const { origin, allowedPaths } =
    typeof site === "string" ? { origin: site, allowedPaths: undefined } : site;
  if (typeof value !== "string") {
    return returnPathFailure(value, source);
  }
  const checked = checkFieldLength(value, returnPathMaximumLength);
  if (!checked.ok) {
    return fail(
      `${source} must be a path on this site of at most ${String(returnPathMaximumLength)} characters, but it has ${String(checked.failure)}.`,
    );
  }
  // The URL parser resolves the value the way a browser does, so a value that only looks like a local path, such as one with a tab after its slash, still fails.
  const url = URL.parse(value, origin);
  if (url?.origin === origin) {
    const path = `${url.pathname}${url.search}${url.hash}`;
    // A value such as "/.//example.com" normalizes to "//example.com", which a browser reads as another site, so the returned path must resolve to this site too.
    if (URL.parse(path, origin)?.origin === origin) {
      if (allowedPaths !== undefined && !allowedPaths.includes(url.pathname)) {
        return fail(
          `${source} must return to ${allowedPaths.join(" or ")}, but it is ${describeValue(path)}.`,
        );
      }
      return succeed(path);
    }
  }
  return returnPathFailure(value, source);
}

function returnPathFailure(
  value: unknown,
  source: string,
): Result<never, string> {
  // A form gives null for a field that it did not send.
  const given = value === null ? "missing" : describeValue(value);
  return fail(
    `${source} must be a path on this site, such as /prices, but it is ${given}.`,
  );
}
