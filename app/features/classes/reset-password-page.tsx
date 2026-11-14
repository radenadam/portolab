import { ClassBackLink } from "./class-back-link";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { Form } from "react-router";
import { resetForgottenPassword } from "~/features/accounts/reset-forgotten-password.server";
import { FormSuccess, SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/reset-password-page";
import type { ClassStudent } from "./class-store.server";
import type { ClassId } from "./classes.schema";
import styles from "./classes.module.css";
import { requireTaughtStudent } from "./taught-class.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.classes_reset_title()) }];
}

export function loader({ context, url, params }: Route.LoaderArgs): {
  classId: ClassId;
  className: string;
  student: ClassStudent;
} {
  const { taughtClass, student } = requireTaughtStudent(context, url, params);
  return { classId: taughtClass.id, className: taughtClass.name, student };
}

export async function action({ context, url, params }: Route.ActionArgs) {
  const { student } = requireTaughtStudent(context, url, params);
  return { temporaryPassword: await resetForgottenPassword(context, student) };
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
            <NumberText>
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
            <NumberText>{actionData.temporaryPassword}</NumberText>
          </p>
        </>
      )}
      <ClassBackLink classId={classId} className={className} />
    </>
  );
}
