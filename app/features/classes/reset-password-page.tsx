import { isClassMapPath } from "./class-path";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { Form } from "react-router";
import { resetForgottenPassword } from "~/features/accounts/reset-forgotten-password.server";
import { FormSuccess, SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import { FormPage } from "~/form-page";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/reset-password-page";
import type { ClassStudent } from "./class-store.server";
import type { ClassId } from "./classes.schema";
import { parseStudentReturnPath } from "~/features/grading/parse-student-return-path";
import { studentsAddress } from "~/features/grading/students-address";
import { studentPageAt } from "~/features/grading/grading-paths";
import styles from "./classes.module.css";
import { requireTaughtStudent } from "./taught-class.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.classes_reset_title()) }];
}

export function loader({ context, url, params }: Route.LoaderArgs): {
  returnPath: string;
  returnLabel: string;
  student: ClassStudent;
} {
  const { taughtClass, student } = requireTaughtStudent(context, url, params);
  const returnPath = parseStudentReturnPath(
    url.searchParams.get("returnTo"),
    "returnTo",
    { origin: url.origin, classId: taughtClass.id, studentId: student.id },
  );
  return {
    student,
    returnLabel: returnLabelOf(returnPath.ok ? returnPath.value : undefined, {
      taughtClass,
      student,
      url,
    }),
    returnPath: returnPath.ok
      ? returnPath.value
      : studentsAddress(taughtClass.id, {
          measure: "alpha",
          filter: "all",
          query: "",
          studentId: student.id,
        }),
  };
}

/** The back link names where it leads: Kelas, the page of the student from which the lecturer came, or Mahasiswa, where a missing or refused address leads too. */
function returnLabelOf(
  returnPath: string | undefined,
  {
    taughtClass,
    student,
    url,
  }: {
    taughtClass: { id: ClassId; name: string };
    student: ClassStudent;
    url: URL;
  },
): string {
  if (returnPath === undefined) return m.classes_students_back_link();
  if (isClassMapPath(returnPath, taughtClass.id))
    return m.classes_back_link({ class: taughtClass.name });
  if (
    studentPageAt(taughtClass.id, new URL(returnPath, url).pathname) !==
    undefined
  )
    return m.classes_student_back_link({ name: student.name });
  return m.classes_students_back_link();
}

export async function action({ context, url, params }: Route.ActionArgs) {
  const { student } = requireTaughtStudent(context, url, params);
  return { temporaryPassword: await resetForgottenPassword(context, student) };
}

export default function ResetPasswordPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { student, returnPath, returnLabel } = loaderData;
  return (
    <FormPage
      title={m.classes_reset_title()}
      back={{ to: returnPath, label: returnLabel }}
    >
      {actionData === undefined ? (
        <>
          <p>
            <NumberText verbatim>
              {m.classes_reset_body({
                name: student.name,
                username: student.username,
              })}
            </NumberText>
          </p>
          <Form method="post" className={formStyles["form"]}>
            <SubmitButton label={m.classes_reset_label()} />
          </Form>
        </>
      ) : (
        <>
          <FormSuccess
            text={m.classes_temporary_password_notice({ name: student.name })}
          />
          <p className={styles["code"]}>
            <NumberText verbatim>{actionData.temporaryPassword}</NumberText>
          </p>
        </>
      )}
    </FormPage>
  );
}
