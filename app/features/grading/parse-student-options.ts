import type { UserId } from "~/features/accounts/accounts.schema";
import { fail, failuresOf, succeed } from "~/result";
import type { Result } from "~/result";
import { parseRecordId } from "~/value-parsers";
import { describeValue } from "~/value-shapes";
import { parseRankingControl } from "./parse-ranking-control";
import { rankingMeasures } from "./ranking-measure";
import { studentFilters } from "./student-filters";
import type { StudentOptions } from "./students-address";

export function parseStudentOptions(
  value: unknown,
  source: string,
): Result<Omit<StudentOptions, "query">, string> {
  if (!(value instanceof URLSearchParams))
    return fail(
      `${source} must be URL search parameters, but it is ${describeValue(value)}.`,
    );
  const measure = parseRankingControl(
    value.get("measure") ?? "alpha",
    `${source}.measure`,
    rankingMeasures,
  );
  const filter = parseRankingControl(
    value.get("filter") ?? "all",
    `${source}.filter`,
    studentFilters,
  );
  const studentText = value.get("student");
  const student =
    studentText === null
      ? succeed(undefined)
      : parseRecordId<UserId>(studentText, `${source}.student`);
  const failures = failuresOf([measure, filter, student]);
  if (!measure.ok || !filter.ok || !student.ok) return fail(failures.join(" "));
  return succeed({
    measure: measure.value,
    filter: filter.value,
    studentId: student.value,
  });
}
