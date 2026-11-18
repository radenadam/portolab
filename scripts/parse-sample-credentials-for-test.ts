import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue } from "../app/value-shapes.ts";

interface Credentials {
  username: string;
  password: string;
}

type StudentSelection = "first" | "last";

/** Printed credentials keep browser tests independent of the sample's account count. */
export function parseSampleCredentialsForTest(
  value: unknown,
  source: string,
  { student = "first" }: { student?: StudentSelection } = {},
): Result<{ lecturer: Credentials; student: Credentials }, string> {
  if (typeof value === "string") {
    const lecturer = /^lecturer \| (\S+) \| (\S+)$/m.exec(value);
    const positions: Record<StudentSelection, number> = { first: 0, last: -1 };
    const selectedStudent = [
      ...value.matchAll(/^student \| (\S+) \| (\S+)$/gm),
    ].at(positions[student]);
    if (
      lecturer?.[1] !== undefined &&
      lecturer[2] !== undefined &&
      selectedStudent?.[1] !== undefined &&
      selectedStudent[2] !== undefined
    ) {
      return succeed({
        lecturer: { username: lecturer[1], password: lecturer[2] },
        student: { username: selectedStudent[1], password: selectedStudent[2] },
      });
    }
  }
  return fail(
    `${source} must print a username and password for both sample roles, but it is ${describeValue(value)}.`,
  );
}
