import type { ReactNode } from "react";
import { data, Form, Link, redirect, useLocation } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readNewStudent } from "~/features/accounts/account-fields";
import type { AccountFormFailures } from "~/features/accounts/account-fields";
import {
  ConsentField,
  NameField,
  UsernameField,
} from "~/features/accounts/account-form-fields";
import { NewPasswordFields } from "~/features/accounts/new-password-fields";
import {
  findUser,
  startSession,
} from "~/features/accounts/current-session.server";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import { FormFailure, SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import { typedText } from "~/form-text";
import { formatRupiah } from "~/formatting";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/join-class-page";
import { findJoinedClass, joinClass } from "./class-store.server";
import type { ClassForStudents } from "./class-store.server";
import styles from "./classes.module.css";
import { createStudentWithinLimit } from "./create-student-within-limit.server";
import { findClassWithCode } from "./find-class-with-code.server";

/** What the page of a code shows: the class with the form that joins it, why the code opens no class, or why a lecturer cannot join. */
type JoinState =
  | { kind: "class"; joinedClass: ClassForStudents; isSignedIn: boolean }
  | { kind: "failure"; failure: string }
  | { kind: "lecturer" };

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: pageTitle(
        loaderData.kind === "class"
          ? m.classes_join_class_title({ class: loaderData.joinedClass.name })
          : m.classes_join_title(),
      ),
    },
  ];
}

export function loader({
  context,
  request,
  params,
}: Route.LoaderArgs): JoinState {
  const user = findUser(context, request);
  if (user?.role === "lecturer") {
    return { kind: "lecturer" };
  }
  const found = findClassWithCode(context, params.code);
  if (!found.ok) {
    return { kind: "failure", failure: found.failure.text };
  }
  const { joinedClass } = found.value;
  if (
    user !== undefined &&
    findJoinedClass(context.get(databaseContext), joinedClass.id, user.id) !==
      undefined
  ) {
    throw redirect(`/classes/${String(joinedClass.id)}`);
  }
  return { kind: "class", joinedClass, isSignedIn: user !== undefined };
}

export async function action({ context, request, params }: Route.ActionArgs) {
  const user = findUser(context, request);
  const found = findClassWithCode(context, params.code);
  if (user?.role === "lecturer" || !found.ok) {
    // The page that the loader shows again explains the code or the role.
    return { fields: undefined, failure: undefined };
  }
  const database = context.get(databaseContext);
  const { joinedClass } = found.value;
  const now = new Date();
  if (user !== undefined) {
    joinClass(database, { classId: joinedClass.id, studentId: user.id }, now);
    return redirect(`/classes/${String(joinedClass.id)}`);
  }
  const form = await request.formData();
  const student = readNewStudent(form);
  if (!student.ok) {
    return data(
      { fields: student.failure, failure: undefined },
      { status: 400 },
    );
  }
  const created = await createStudentWithinLimit(context, student.value, now);
  if (!created.ok) {
    const typedFields = {
      name: typedText(form.get("name")),
      username: typedText(form.get("username")),
      nameFailure: undefined,
      usernameFailure: undefined,
      newPasswordFailure: undefined,
      repeatedPasswordFailure: undefined,
      consentFailure: undefined,
    };
    switch (created.failure.kind) {
      case "blocked":
        return data(
          { fields: typedFields, failure: created.failure.text },
          { status: 429 },
        );
      case "usernameTaken":
        return data(
          {
            fields: {
              ...typedFields,
              usernameFailure: m.classes_username_taken_error({
                username: student.value.username,
              }),
            },
            failure: undefined,
          },
          { status: 400 },
        );
    }
  }
  joinClass(
    database,
    { classId: joinedClass.id, studentId: created.value },
    now,
  );
  return redirect(`/classes/${String(joinedClass.id)}`, {
    headers: {
      "Set-Cookie": await startSession(database, request, created.value),
    },
  });
}

export default function JoinClassPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  switch (loaderData.kind) {
    case "lecturer":
      return (
        <>
          <h1>{m.classes_join_title()}</h1>
          <p>{m.classes_lecturer_join_error()}</p>
        </>
      );
    case "failure":
      return (
        <>
          <h1>{m.classes_join_title()}</h1>
          <p>{loaderData.failure}</p>
          <Link to="/join" className={styles["link"]}>
            {m.classes_other_code_link()}
          </Link>
        </>
      );
    case "class":
      return (
        <ClassToJoin
          joinedClass={loaderData.joinedClass}
          isSignedIn={loaderData.isSignedIn}
          fields={actionData?.fields}
          failure={actionData?.failure}
        />
      );
  }
}

function ClassToJoin({
  joinedClass,
  isSignedIn,
  fields,
  failure,
}: {
  joinedClass: ClassForStudents;
  isSignedIn: boolean;
  fields: AccountFormFailures | undefined;
  failure: string | undefined;
}): ReactNode {
  return (
    <>
      <h1>{m.classes_join_class_title({ class: joinedClass.name })}</h1>
      <p>
        {m.classes_join_class_body({
          lecturer: joinedClass.lecturerName,
          cash: formatRupiah(joinedClass.startingCash),
        })}
      </p>
      {isSignedIn ? (
        <Form method="post" className={formStyles["form"]}>
          <SubmitButton label={m.classes_join_label()} />
        </Form>
      ) : (
        <NewStudentForm fields={fields} failure={failure} />
      )}
    </>
  );
}

function NewStudentForm({
  fields,
  failure,
}: {
  fields: AccountFormFailures | undefined;
  /** Why the form created no account, apart from its fields. */
  failure: string | undefined;
}): ReactNode {
  return (
    <>
      <h2>{m.classes_new_account_title()}</h2>
      <Form method="post" className={formStyles["form"]}>
        {failure !== undefined && <FormFailure text={failure} />}
        <NameField hint={m.classes_student_name_hint()} failures={fields} />
        <UsernameField failures={fields} />
        <NewPasswordFields failures={fields} />
        <ConsentField failures={fields} />
        <SubmitButton label={m.classes_create_account_label()} />
      </Form>
      <ExistingAccountLink />
    </>
  );
}

// The sign-in page returns to this page, where the student who signed in joins with one button.
function ExistingAccountLink(): ReactNode {
  const { pathname } = useLocation();
  return (
    <Link to={pathReturningTo("/sign-in", pathname)} className={styles["link"]}>
      {m.classes_existing_account_link()}
    </Link>
  );
}
