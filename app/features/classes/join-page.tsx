import type { ReactNode } from "react";
import { data, redirect } from "react-router";
import { databaseContext } from "~/database/database.server";
import { findUser } from "~/features/accounts/current-session.server";
import { typedText } from "~/form-text";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/join-page";
import { joinClass } from "./class-store.server";
import { CodeForm } from "./code-form";
import { findClassWithCode } from "./find-class-with-code.server";
import { joinPath } from "./join-code";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.classes_join_title()) }];
}

export function loader({
  context,
  request,
}: Route.LoaderArgs): ReturnType<typeof data<{ isLecturer: boolean }>> {
  switch (findUser(context, request)?.role) {
    case "lecturer":
      // The page explains that only students join, which refuses the lecturer.
      return data({ isLecturer: true }, { status: 403 });
    case "student":
    case undefined:
      return data({ isLecturer: false });
  }
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = findUser(context, request);
  const form = await request.formData();
  const found = findClassWithCode(context, form.get("code"));
  if (!found.ok) {
    return data(
      { code: typedText(form.get("code")), failure: found.failure },
      { status: found.failure.status },
    );
  }
  const { joinCode, joinedClass } = found.value;
  switch (user?.role) {
    case "student":
      // A student who is signed in joins at once.
      joinClass(
        context.get(databaseContext),
        { classId: joinedClass.id, studentId: user.id },
        new Date(),
      );
      return redirect(`/classes/${String(joinedClass.id)}`);
    case "lecturer":
    case undefined:
      // A visitor first sees the class and creates an account on its page, and a lecturer sees there why a lecturer cannot join.
      return redirect(joinPath(joinCode));
  }
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
        <CodeForm code={actionData?.code} failure={actionData?.failure} />
      )}
    </>
  );
}
