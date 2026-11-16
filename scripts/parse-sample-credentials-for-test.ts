import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue } from "../app/value-shapes.ts";

interface Credentials {
  username: string;
  password: string;
}

/** Reads one printed account of each role so that browser tests use the command's generated credentials. */
export function parseSampleCredentialsForTest(
  value: unknown,
  source: string,
): Result<{ lecturer: Credentials; student: Credentials }, string> {
  if (typeof value === "string") {
    const lecturer = /^lecturer \| (\S+) \| (\S+)$/m.exec(value);
    const student = /^student \| (\S+) \| (\S+)$/m.exec(value);
    if (
      lecturer?.[1] !== undefined &&
      lecturer[2] !== undefined &&
      student?.[1] !== undefined &&
      student[2] !== undefined
    ) {
      return succeed({
        lecturer: { username: lecturer[1], password: lecturer[2] },
        student: { username: student[1], password: student[2] },
      });
    }
  }
  return fail(
    `${source} must print a username and password for both sample roles, but it is ${describeValue(value)}.`,
  );
}
