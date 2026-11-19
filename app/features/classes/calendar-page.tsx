import type { ReactNode } from "react";
import { data, Form, redirect } from "react-router";
import { databaseContext } from "~/database/database.server";
import { SubmitButton } from "~/form";
import { parseReturnPath } from "~/parse-return-path";
import { FormPage } from "~/form-page";
import { classBackLabel } from "./class-back-label";
import { FirstSessionField } from "./first-session-field";
import formStyles from "~/form.module.css";
import { typedText } from "~/form-text";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/calendar-page";
import { setFirstSessionDate } from "./class-store.server";
import type { ClassId } from "./classes.schema";
import { classPath } from "./class-path";
import { parseFirstSessionDate } from "./parse-first-session-date";
import { requireTaughtClass } from "./taught-class.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.classes_calendar_title()) }];
}

export function loader({ context, params, url }: Route.LoaderArgs): {
  className: string;
  firstSessionDate: string | null;
  returnPath: string;
} {
  const taught = requireTaughtClass(context, url, params.classId);
  return {
    className: taught.name,
    returnPath: calendarReturnPath(url, taught.id),
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
  return redirect(calendarReturnPath(url, taught.id));
}

export default function CalendarPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { className, firstSessionDate, returnPath } = loaderData;
  return (
    <FormPage
      title={m.classes_calendar_title()}
      back={{ to: returnPath, label: classBackLabel(className) }}
    >
      <Form method="post" noValidate className={formStyles["form"]}>
        <FirstSessionField
          failure={actionData?.failure}
          defaultValue={
            actionData?.firstSessionDate ?? firstSessionDate ?? undefined
          }
        />
        <SubmitButton label={m.classes_save_calendar_label()} />
      </Form>
    </FormPage>
  );
}

function calendarReturnPath(url: URL, classId: ClassId): string {
  const fallback = classPath(classId);
  const parsed = parseReturnPath(url.searchParams.get("returnTo"), "returnTo", {
    origin: url.origin,
    allowedPaths: [fallback],
  });
  return parsed.ok ? parsed.value : fallback;
}
