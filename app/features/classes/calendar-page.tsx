import type { ReactNode } from "react";
import { data, Form, Link, redirect } from "react-router";
import { databaseContext } from "~/database/database.server";
import { SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import { typedText } from "~/form-text";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/calendar-page";
import { setFirstSessionDate } from "./class-store.server";
import type { ClassId } from "./classes.schema";
import { classPath } from "./class-path";
import styles from "./classes.module.css";
import { FirstSessionField } from "./first-session-field";
import { parseFirstSessionDate } from "./parse-first-session-date";
import { requireTaughtClass } from "./taught-class.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.classes_calendar_title()) }];
}

export function loader({ context, params, url }: Route.LoaderArgs): {
  classId: ClassId;
  className: string;
  firstSessionDate: string | null;
} {
  const taught = requireTaughtClass(context, url, params.classId);
  return {
    classId: taught.id,
    className: taught.name,
    firstSessionDate: taught.firstSessionDate,
  };
}

/** Saves the date of session 1 that the lecturer gave and opens the page of the class, which shows the session of the week from it, or answers with the date as the lecturer gave it and the reason that it was not accepted. */
export async function action({
  context,
  params,
  request,
  url,
}: Route.ActionArgs) {
  const now = new Date();
  const taught = requireTaughtClass(context, url, params.classId);
  const form = await request.formData();
  const firstSessionDate = parseFirstSessionDate(
    form.get("firstSessionDate"),
    m.classes_first_session_label(),
    now,
  );
  if (!firstSessionDate.ok) {
    return data(
      {
        firstSessionDate: typedText(form.get("firstSessionDate")),
        failure: firstSessionDate.failure,
      },
      { status: 400 },
    );
  }
  setFirstSessionDate(
    context.get(databaseContext),
    taught.id,
    firstSessionDate.value,
  );
  return redirect(classPath(taught.id));
}

export default function CalendarPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { classId, className, firstSessionDate } = loaderData;
  return (
    <>
      <h1>{m.classes_calendar_title()}</h1>
      <Form method="post" noValidate className={formStyles["form"]}>
        <FirstSessionField
          failure={actionData?.failure}
          defaultValue={
            actionData?.firstSessionDate ?? firstSessionDate ?? undefined
          }
        />
        <SubmitButton label={m.classes_save_calendar_label()} />
      </Form>
      <Link to={classPath(classId)} className={styles["link"]}>
        {m.classes_back_link({ class: className })}
      </Link>
    </>
  );
}
