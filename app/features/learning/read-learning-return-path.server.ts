import { parseReturnPath } from "~/parse-return-path";
import { writeLog } from "~/write-log.server";

export function readLearningReturnPath(
  value: unknown,
  url: URL,
): string | undefined {
  if (value === null || value === "") return undefined;
  const parsed = parseReturnPath(value, "returnTo", url.origin);
  if (!parsed.ok) {
    writeLog("warning", parsed.failure);
    return undefined;
  }
  return parsed.value;
}
