import type { ReactNode } from "react";
import { Form, Link } from "react-router";
import { resetForgottenPassword } from "~/features/accounts/reset-forgotten-password.server";
import { FormSuccess, SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/reset-password-page";
import type { ClassStudent } from "./class-store.server";
import { parseStudentReturnPath } from "~/features/grading/parse-student-return-path";
import { studentsAddress } from "~/features/grading/students-address";
import styles from "./classes.module.css";
import { requireTaughtStudent } from "./taught-class.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.classes_reset_title()) }];
}

export function loader({ context, url, params }: Route.LoaderArgs): {
  returnPath: string;
  student: ClassStudent;
} {
  const { taughtClass, student } = requireTaughtStudent(context, url, params);
  const returnPath = parseStudentReturnPath(
    url.searchParams.get("returnTo"),
    "returnTo",
    { origin: url.origin, classId: taughtClass.id },
  );
  return {
    student,
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

export async function action({ context, url, params }: Route.ActionArgs) {
  const { student } = requireTaughtStudent(context, url, params);
  return { temporaryPassword: await resetForgottenPassword(context, student) };
}

export default function ResetPasswordPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { student, returnPath } = loaderData;
  return (
    <section className={styles["reset"]} data-layout="reading">
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
          <FormSuccess
            text={m.classes_temporary_password_notice({ name: student.name })}
          />
          <p className={styles["code"]}>{actionData.temporaryPassword}</p>
        </>
      )}
      <Link to={returnPath} className={styles["link"]}>
        {m.classes_students_back_link()}
      </Link>
    </section>
  );
}
