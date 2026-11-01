import type { ReactNode } from "react";
import { data, Form, Link, redirect, useLocation } from "react-router";
import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import type { User } from "~/features/accounts/account";
import {
  readNewStudent,
  typedAccountForm,
} from "~/features/accounts/account-fields";
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
import { formatRupiah } from "~/formatting";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/join-class-page";
import { classPath } from "./class-path";
import { findJoinedClass } from "./class-store.server";
import type { ClassForStudents } from "./class-store.server";
import styles from "./classes.module.css";
import { CodeForm } from "./code-form";
import { createStudentWithinLimit } from "./create-student-within-limit.server";
import type { ClassId } from "./classes.schema";
import { findClassWithCode } from "./find-class-with-code.server";
import type { CodeFailure } from "./find-class-with-code.server";
import { joinAndOpenClass } from "./join-and-open-class.server";

/** What the address of a code shows: the class with the form that joins it, the form for a code with the code from the address and why it opens no class, or why a lecturer cannot join. */
type JoinState =
  | { kind: "class"; joinedClass: ClassForStudents; isSignedIn: boolean }
  | { kind: "wrongCode"; code: string; failure: CodeFailure }
  | { kind: "lecturer" };

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  switch (loaderData.kind) {
    case "class":
      return [
        {
          title: pageTitle(
            m.classes_join_class_title({ class: loaderData.joinedClass.name }),
          ),
        },
      ];
    case "wrongCode":
    case "lecturer":
      return [{ title: pageTitle(m.classes_join_title()) }];
  }
}

export function loader({
  context,
  request,
  params,
}: Route.LoaderArgs): ReturnType<typeof data<JoinState>> {
  const user = findUser(context, request);
  switch (user?.role) {
    case "lecturer":
      // The page explains that only students join, which refuses the lecturer.
      return data<JoinState>({ kind: "lecturer" }, { status: 403 });
    case "student":
    case undefined:
      return classToJoin(context, {
        code: params.code,
        student: user,
        now: new Date(),
      });
  }
}

/** The class that the code of the address opens for a student who is signed in or for a visitor, or the form for a code with the reason why it opens none. A student who joined the class already goes to it. */
function classToJoin(
  context: Readonly<RouterContextProvider>,
  {
    code,
    student,
    now,
  }: { code: string; student: User | undefined; now: Date },
): ReturnType<typeof data<JoinState>> {
  const found = findClassWithCode(context, code, now);
  if (!found.ok) {
    return data<JoinState>(
      { kind: "wrongCode", code, failure: found.failure },
      { status: found.failure.status },
    );
  }
  const { joinedClass } = found.value;
  if (
    student !== undefined &&
    findJoinedClass(
      context.get(databaseContext),
      joinedClass.id,
      student.id,
    ) !== undefined
  ) {
    throw redirect(classPath(joinedClass.id));
  }
  return data<JoinState>({
    kind: "class",
    joinedClass,
    isSignedIn: student !== undefined,
  });
}

export async function action({ context, request, params }: Route.ActionArgs) {
  const now = new Date();
  const user = findUser(context, request);
  const found = findClassWithCode(context, params.code, now);
  if (!found.ok) {
    // The code opened the class when the page loaded, so the class went away or the network reached its limit since, and the page shows why above its form.
    return data(
      { fields: undefined, failure: found.failure.text },
      { status: found.failure.status },
    );
  }
  const { joinedClass } = found.value;
  switch (user?.role) {
    case "lecturer":
      // The page of a lecturer has no form for joining, so only a forged form comes here, and the page that the loader shows explains why a lecturer cannot join.
      return data({ fields: undefined, failure: undefined }, { status: 403 });
    case "student":
      return joinAndOpenClass(
        context.get(databaseContext),
        { classId: joinedClass.id, studentId: user.id },
        now,
      );
    case undefined:
      return createStudentInClass(context, request, {
        classId: joinedClass.id,
        now,
      });
  }
}

/** Creates the account of a visitor from the form, adds it to the class, and signs the visitor in. */
async function createStudentInClass(
  context: Readonly<RouterContextProvider>,
  request: Request,
  { classId, now }: { classId: ClassId; now: Date },
) {
  const database = context.get(databaseContext);
  const form = await request.formData();
  const newStudent = readNewStudent(form);
  if (!newStudent.ok) {
    return data(
      { fields: newStudent.failure, failure: undefined },
      { status: 400 },
    );
  }
  const created = await createStudentWithinLimit(
    context,
    newStudent.value,
    now,
  );
  if (!created.ok) {
    const typedFields = typedAccountForm(form);
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
                field: m.accounts_username_label(),
                username: newStudent.value.username,
              }),
            },
            failure: undefined,
          },
          { status: 400 },
        );
    }
  }
  const response = joinAndOpenClass(
    database,
    { classId, studentId: created.value },
    now,
  );
  response.headers.append(
    "Set-Cookie",
    await startSession(database, request, { userId: created.value, now }),
  );
  return response;
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
    case "wrongCode":
      return (
        <>
          <h1>{m.classes_join_title()}</h1>
          <CodeForm code={loaderData.code} failure={loaderData.failure} />
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
          {failure !== undefined && <FormFailure text={failure} />}
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
  /** Why the form created no account, apart from its fields, such as a limit on attempts. */
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
