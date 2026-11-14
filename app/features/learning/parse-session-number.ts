import type { SessionNumber } from "../classes/course-calendar.ts";
import { parseRecordId } from "../../value-parsers.ts";
import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue } from "../../value-shapes.ts";
import { contentSession } from "./content.ts";

export function parseSessionNumber(
  value: unknown,
  source: string,
): Result<SessionNumber, string> {
  const number = parseRecordId<number>(value, source);
  if (!number.ok) return number;
  const session = contentSession(number.value);
  return session === undefined
    ? fail(
        `${source} must name a session of the course, but it is ${describeValue(value)}.`,
      )
    : succeed(session);
}
