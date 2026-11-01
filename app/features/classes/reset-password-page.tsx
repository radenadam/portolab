import type { ReactNode } from "react";
import { data, Form, Link } from "react-router";
import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import { resetPassword } from "~/features/accounts/account-store.server";
import { requireLecturer } from "~/features/accounts/current-session.server";
import { passwordLimitersContext } from "~/features/accounts/password-attempts.server";
import { SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { parseRecordId } from "~/value-parsers";
import type { Route } from "./+types/reset-password-page";
import { findClassStudent, findTaughtClass } from "./class-store.server";
import type { ClassStudent } from "./class-store.server";
import type { ClassId } from "./classes.schema";
import styles from "./classes.module.css";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.classes_reset_title()) }];
}

/** The class and its student whose password the lecturer who is signed in may reset. A class of another lecturer, or a person who is not its student, answers as an address that does not exist, so a guessed address reveals nothing. */
function requireStudentOfTaughtClass(
  context: Readonly<RouterContextProvider>,
  request: Request,
  params: Route.LoaderArgs["params"],
): { classId: ClassId; className: string; student: ClassStudent } {
  const lecturer = requireLecturer(context, request);
  const classId = parseRecordId<ClassId>(params.classId, "classId");
  const studentId = parseRecordId<UserId>(params.studentId, "studentId");
  const database = context.get(databaseContext);
  const taught = classId.ok
    ? findTaughtClass(database, classId.value, lecturer.id)
    : undefined;
  const student =
    taught !== undefined && studentId.ok
      ? findClassStudent(database, taught.id, studentId.value)
      : undefined;
  if (taught === undefined || student === undefined) {
    throw data(null, { status: 404 });
  }
  return { classId: taught.id, className: taught.name, student };
}

export function loader({ context, request, params }: Route.LoaderArgs): {
  classId: ClassId;
  className: string;
  student: ClassStudent;
} {
  return requireStudentOfTaughtClass(context, request, params);
}

export async function action({ context, request, params }: Route.ActionArgs) {
  const { student } = requireStudentOfTaughtClass(context, request, params);
  const temporaryPassword = await resetPassword(
    context.get(databaseContext),
    student.id,
  );
  // A student who reached the limit of wrong passwords may sign in with the new one at once.
  context.get(passwordLimitersContext).byUsername.forget(student.username);
  return { temporaryPassword };
}

export default function ResetPasswordPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { classId, className, student } = loaderData;
  return (
    <>
      <h1>{m.classes_reset_title()}</h1>
      {actionData === undefined ? (
        <>
          <p>
            {m.classes_reset_body({
              name: student.name,
              username: student.username,
            })}
          </p>
          <Form method="post" className={formStyles["form"]}>
            <SubmitButton label={m.classes_reset_label()} />
          </Form>
        </>
      ) : (
        <>
          <p role="status">
            {m.classes_temporary_password_notice({ name: student.name })}
          </p>
          <p className={styles["code"]}>{actionData.temporaryPassword}</p>
        </>
      )}
      <Link to={`/classes/${String(classId)}`} className={styles["link"]}>
        {m.classes_back_link({ class: className })}
      </Link>
    </>
  );
}
