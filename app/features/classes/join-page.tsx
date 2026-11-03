import type { ReactNode } from "react";
import { data, redirect } from "react-router";
import { databaseContext } from "~/database/database.server";
import { findUser } from "~/features/accounts/current-session.server";
import { typedText } from "~/form-text";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/join-page";
import { CodeForm } from "./code-form";
import { findClassWithCode } from "./find-class-with-code.server";
import { joinAndOpenClass } from "./join-and-open-class.server";
import { joinPath } from "./join-code";
import { LecturerCannotJoin } from "./lecturer-cannot-join";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: pageTitle(
        loaderData.isLecturer
          ? m.classes_lecturer_join_title()
          : m.classes_join_title(),
      ),
    },
  ];
}

export function loader({
  context,
  url,
}: Route.LoaderArgs): ReturnType<typeof data<{ isLecturer: boolean }>> {
  switch (findUser(context, url)?.role) {
    case "lecturer":
      // The page explains that only students join, which refuses the lecturer.
      return data({ isLecturer: true }, { status: 403 });
    case "student":
    case undefined:
      return data({ isLecturer: false });
  }
}

export async function action({ context, request, url }: Route.ActionArgs) {
  const now = new Date();
  const user = findUser(context, url);
  const form = await request.formData();
  const found = findClassWithCode(context, form.get("code"), now);
  if (!found.ok) {
    return data(
      { code: typedText(form.get("code")), failure: found.failure },
      { status: found.failure.status },
    );
  }
  const { joinCode, classToJoin } = found.value;
  switch (user?.role) {
    case "student":
      return joinAndOpenClass(
        context.get(databaseContext),
        { classId: classToJoin.id, studentId: user.id },
        now,
      );
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
  return loaderData.isLecturer ? (
    <LecturerCannotJoin />
  ) : (
    <>
      <h1>{m.classes_join_title()}</h1>
      <CodeForm code={actionData?.code} failure={actionData?.failure} />
    </>
  );
}
