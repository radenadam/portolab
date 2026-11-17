import { data } from "react-router";
import type { Database } from "~/database/database.server";
import type { User } from "~/features/accounts/account";
import { typedText } from "~/form-text";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { parseRecordId } from "~/value-parsers";
import { findJoinedClass } from "./class-store.server";
import type { ClassId } from "./classes.schema";
import type { NimFieldValue } from "./nim-field";
import { parseStudentNim } from "./student-nim";
import { setStudentNim } from "./set-student-nim.server";

export interface NimAnswer extends NimFieldValue {
  classId: ClassId;
  savedAt: string | undefined;
}

/** The account page authenticates the reader before calling this action. */
export function changeStudentNim(
  database: Database,
  { user, form, now }: { user: User; form: FormData; now: Date },
): Result<NimAnswer, NimAnswer> {
  const classId = parseRecordId<ClassId>(form.get("classId"), "classId");
  if (
    !classId.ok ||
    user.role !== "student" ||
    findJoinedClass(database, classId.value, user.id) === undefined
  )
    throw data(null, { status: 404 });
  const nim = parseStudentNim(form.get("nim"), m.classes_nim_label());
  if (!nim.ok)
    return fail({
      classId: classId.value,
      nim: typedText(form.get("nim")),
      nimFailure: nim.failure,
      savedAt: undefined,
    });
  // The operator can delete the membership between the lookup and this write.
  if (
    !setStudentNim(database, {
      classId: classId.value,
      studentId: user.id,
      nim: nim.value,
    })
  )
    throw data(null, { status: 404 });
  return succeed({
    classId: classId.value,
    nim: nim.value ?? "",
    nimFailure: undefined,
    savedAt: now.toISOString(),
  });
}
