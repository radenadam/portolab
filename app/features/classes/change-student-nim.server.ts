import type { Database } from "~/database/database.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import { typedText } from "~/form-text";
import { m } from "~/paraglide/messages.js";
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

/** What the form of the NIM of a class did: it saved the NIM, it refused the field, or it named a class that the student is not in. */
export type NimChange =
  | { kind: "saved"; answer: NimAnswer }
  | { kind: "refused"; answer: NimAnswer }
  | { kind: "notJoined" };

/** The account page finds the signed-in student before it calls this. */
export function changeStudentNim(
  database: Database,
  { studentId, form, now }: { studentId: UserId; form: FormData; now: Date },
): NimChange {
  const classId = parseRecordId<ClassId>(form.get("classId"), "classId");
  if (
    !classId.ok ||
    findJoinedClass(database, classId.value, studentId) === undefined
  )
    return { kind: "notJoined" };
  const nim = parseStudentNim(form.get("nim"), m.classes_nim_label());
  if (!nim.ok)
    return {
      kind: "refused",
      answer: {
        classId: classId.value,
        nim: typedText(form.get("nim")),
        nimFailure: nim.failure,
        savedAt: undefined,
      },
    };
  // The operator can delete the membership between the lookup and this write.
  if (
    !setStudentNim(database, {
      classId: classId.value,
      studentId,
      nim: nim.value,
    })
  )
    return { kind: "notJoined" };
  return {
    kind: "saved",
    answer: {
      classId: classId.value,
      nim: nim.value ?? "",
      nimFailure: undefined,
      savedAt: now.toISOString(),
    },
  };
}
