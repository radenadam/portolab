import type { ReactNode } from "react";
import { data, Form, redirect } from "react-router";
import { databaseContext } from "~/database/database.server";
import { findUser } from "~/features/accounts/current-session.server";
import { SubmitButton, TextField } from "~/form";
import formStyles from "~/form.module.css";
import { typedText } from "~/form-text";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/join-page";
import { joinClass } from "./class-store.server";
import { findClassWithCode } from "./find-class-with-code.server";
import { joinPath } from "./join-code";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.classes_join_title()) }];
}

export function loader({ context, request }: Route.LoaderArgs): {
  isLecturer: boolean;
} {
  return { isLecturer: findUser(context, request)?.role === "lecturer" };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = findUser(context, request);
  const form = await request.formData();
  const found = findClassWithCode(context, form.get("code"));
  if (!found.ok) {
    return data(
      { code: typedText(form.get("code")), codeFailure: found.failure },
      { status: 400 },
    );
  }
  const { joinCode, joinedClass } = found.value;
  // A student who is signed in joins at once. A visitor first sees the class and creates an account on its page.
  if (user?.role === "student") {
    joinClass(
      context.get(databaseContext),
      { classId: joinedClass.id, studentId: user.id },
      new Date(),
    );
    return redirect(`/classes/${String(joinedClass.id)}`);
  }
  return redirect(joinPath(joinCode));
}

export default function JoinPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  return (
    <>
      <h1>{m.classes_join_title()}</h1>
      {loaderData.isLecturer ? (
        <p>{m.classes_lecturer_join_error()}</p>
      ) : (
        <>
          <p>{m.classes_join_body()}</p>
          <Form method="post" className={formStyles["form"]}>
            <TextField
              name="code"
              label={m.classes_code_label()}
              type="text"
              autoComplete="off"
              failure={actionData?.codeFailure}
              defaultValue={actionData?.code}
            />
            <SubmitButton label={m.classes_continue_label()} />
          </Form>
        </>
      )}
    </>
  );
}
