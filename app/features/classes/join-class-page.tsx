import type { ReactNode } from "react";
import { data, redirect } from "react-router";
import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import type { User } from "~/features/accounts/account";
import {
  readNewStudent,
  typedAccountForm,
} from "~/features/accounts/account-fields";
import type { AccountFormFailures } from "~/features/accounts/account-fields";
import {
  findUser,
  startSession,
} from "~/features/accounts/current-session.server";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import { isLoadedByAnotherSite } from "~/is-loaded-by-another-site.server";
import { PageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/join-class-page";
import { classPath } from "./class-path";
import { findJoinedClass } from "./class-store.server";
import type { ClassForStudents } from "./class-store.server";
import { ClassToJoin } from "./class-to-join";
import { CodeForm } from "./code-form";
import { createStudentWithinLimit } from "./create-student-within-limit.server";
import type { ClassId } from "./classes.schema";
import { findClassWithCode } from "./find-class-with-code.server";
import type { CodeFailure } from "./find-class-with-code.server";
import { joinAndOpenClass } from "./join-and-open-class.server";
import { LecturerCannotJoin } from "./lecturer-cannot-join";

/** What the address of a code shows: the class with the form that joins it, the form for a code with the code from the address and why it opens no class, if the page checked the code, or why a lecturer cannot join. */
type JoinState =
  | { kind: "class"; classToJoin: ClassForStudents; isSignedIn: boolean }
  | { kind: "codeForm"; code: string; failure: CodeFailure | undefined }
  | { kind: "lecturer" };

/** The answer of the action to a form that it did not accept: why each field of a new account was not accepted, why the form was not accepted apart from its fields, and the state of the page when it changed since the page loaded. */
interface JoinAnswer {
  fields: AccountFormFailures | undefined;
  failure: string | undefined;
  state: JoinState | undefined;
}

export function loader({
  context,
  request,
  params,
  url,
}: Route.LoaderArgs): ReturnType<typeof data<JoinState>> {
  const user = findUser(context, url);
  switch (user?.role) {
    case "lecturer":
      // The page explains that only students join, which refuses the lecturer.
      return data<JoinState>({ kind: "lecturer" }, { status: 403 });
    case "student":
    case undefined:
      // A page of another site can make a browser load this address without the reader opening it, such as through an image. Its code would count against the limit on wrong codes of the whole network of the reader, so the page shows the form for a code without checking the code.
      if (isLoadedByAnotherSite(request)) {
        return data<JoinState>({
          kind: "codeForm",
          code: params.code,
          failure: undefined,
        });
      }
      return findJoinState(context, {
        code: params.code,
        student: user,
        now: new Date(),
      });
  }
}

/** Finds what the address of a code shows to a student who is signed in or to a visitor: the class that the code opens, or the form for a code with the reason why it opens none. A student who joined the class already goes to it. */
function findJoinState(
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
      { kind: "codeForm", code, failure: found.failure },
      { status: found.failure.status },
    );
  }
  const { classToJoin } = found.value;
  if (
    student !== undefined &&
    findJoinedClass(
      context.get(databaseContext),
      classToJoin.id,
      student.id,
    ) !== undefined
  ) {
    throw redirect(classPath(classToJoin.id));
  }
  return data<JoinState>({
    kind: "class",
    classToJoin,
    isSignedIn: student !== undefined,
  });
}

export async function action({
  context,
  request,
  params,
  url,
}: Route.ActionArgs) {
  const now = new Date();
  const user = findUser(context, url);
  const form = await request.formData();
  const found = findClassWithCode(context, params.code, now);
  if (!found.ok) {
    // The code opened the class when the page loaded, so the class went away or the network reached its limit since. React Router loads no page again after a refused form, so the answer carries the state of the page, the form for a code, which shows each reason in its place.
    return data<JoinAnswer>(
      {
        fields: undefined,
        failure: undefined,
        state: { kind: "codeForm", code: params.code, failure: found.failure },
      },
      { status: found.failure.status },
    );
  }
  const { classToJoin } = found.value;
  switch (user?.role) {
    case "lecturer":
      // The page of a lecturer has no form for joining, so a form comes here only from a page that loaded before a lecturer signed in, or from a forged one, and the answer explains why a lecturer cannot join.
      return data<JoinAnswer>(
        { fields: undefined, failure: undefined, state: { kind: "lecturer" } },
        { status: 403 },
      );
    case "student":
      return joinAndOpenClass(
        context.get(databaseContext),
        { classId: classToJoin.id, studentId: user.id },
        now,
      );
    case undefined:
      // A student who was signed in when the page loaded sends the form with one button, so a session that ended since goes to the sign-in page, which returns here, as on every page that needs a session.
      if (form.has("signedIn")) {
        return redirect(pathReturningTo("/sign-in", url.pathname));
      }
      return createStudentInClass(context, request, {
        form,
        classId: classToJoin.id,
        now,
      });
  }
}

/** Creates the account of a visitor from the form, adds it to the class, and signs the visitor in. */
async function createStudentInClass(
  context: Readonly<RouterContextProvider>,
  request: Request,
  { form, classId, now }: { form: FormData; classId: ClassId; now: Date },
) {
  const database = context.get(databaseContext);
  const newStudent = readNewStudent(form);
  if (!newStudent.ok) {
    return data<JoinAnswer>(
      { fields: newStudent.failure, failure: undefined, state: undefined },
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
        return data<JoinAnswer>(
          {
            fields: typedFields,
            failure: created.failure.text,
            state: undefined,
          },
          { status: 429 },
        );
      case "usernameTaken":
        return data<JoinAnswer>(
          {
            fields: {
              ...typedFields,
              usernameFailure: m.classes_username_taken_error({
                field: m.accounts_username_label(),
                username: typedFields.username.trim(),
              }),
            },
            failure: undefined,
            state: undefined,
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
  const state: JoinState = actionData?.state ?? loaderData;
  switch (state.kind) {
    case "lecturer":
      return (
        <>
          <PageTitle text={m.classes_lecturer_join_title()} />
          <LecturerCannotJoin />
        </>
      );
    case "codeForm":
      return (
        <>
          <PageTitle text={m.classes_join_title()} />
          <h1>{m.classes_join_title()}</h1>
          <CodeForm code={state.code} failure={state.failure} />
        </>
      );
    case "class":
      return (
        <>
          <PageTitle
            text={m.classes_join_class_title({ class: state.classToJoin.name })}
          />
          <ClassToJoin
            classToJoin={state.classToJoin}
            isSignedIn={state.isSignedIn}
            fields={actionData?.fields}
            failure={actionData?.failure}
          />
        </>
      );
  }
}
