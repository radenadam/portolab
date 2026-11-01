import { parseReturnPath } from "./parse-return-path";
import { writeLog } from "./write-log.server";

/** The path that a form asks to return to after it succeeds, or the home page when it names none. A path that leads to another site goes to the home page too, and its failure goes to the log, because only a forged link sends one. */
export function returnDestination(value: unknown, request: Request): string {
  if (value === null || value === "") {
    return "/";
  }
  const returnPath = parseReturnPath(
    value,
    "returnTo",
    new URL(request.url).origin,
  );
  if (!returnPath.ok) {
    writeLog("warning", returnPath.failure);
    return "/";
  }
  return returnPath.value;
}
