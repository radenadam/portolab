import type { ReactNode } from "react";
import { data, Form, Link, redirect } from "react-router";
import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import type { Role, UserId } from "~/features/accounts/accounts.schema";
import { requireUser } from "~/features/accounts/current-session.server";
import { ErrorPage } from "~/error-page";
import { SubmitButton, TextField } from "~/form";
import formStyles from "~/form.module.css";
import { parseShortText, typedText } from "~/form-text";
import { formatNumber, formatRupiah } from "~/formatting";
import { PageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { failureOf } from "~/result";
import type { Route } from "./+types/classes-page";
import {
  createClass,
  listJoinedClasses,
  listTaughtClasses,
} from "./class-store.server";
import type { JoinedClass, TaughtClass } from "./class-store.server";
import { classPath } from "./class-path";
import { ClassList } from "./class-list";
import type { ListedClass } from "./class-list";
import styles from "./classes.module.css";
import { parseStartingCash } from "./parse-starting-cash";
import { classNameMaximumLength, defaultStartingCash } from "./class-rules";
import { FirstSessionField } from "./first-session-field";
import { parseFirstSessionDate } from "./parse-first-session-date";

export function loader({
  context,
  url,
}: Route.LoaderArgs):
  | { role: "lecturer"; classes: TaughtClass[] }
  | { role: "student"; classes: JoinedClass[] } {
  const user = requireUser(context, url);
  const database = context.get(databaseContext);
  switch (user.role) {
    case "lecturer":
      return {
        role: user.role,
        classes: listTaughtClasses(database, user.id),
      };
    case "student":
      return {
        role: user.role,
        classes: listJoinedClasses(database, user.id),
      };
  }
}

export async function action({ context, request, url }: Route.ActionArgs) {
  const user = requireUser(context, url);
  switch (user.role) {
    case "lecturer":
      return createClassFromForm(context, request, {
        lecturerId: user.id,
        now: new Date(),
      });
    case "student":
      // The page of a student has no form for a class, so a form comes here only from a page that loaded before a student signed in, or from a forged one, and the page says why it refused.
      return data(
        { fields: undefined, failure: m.classes_lecturer_only_error() },
        { status: 403 },
      );
  }
}

/** Why the fields of the form that creates a class were not accepted, with their values as the lecturer typed them, so the form can show them again. */
interface NewClassFailures {
  name: string;
  firstSessionDate: string;
  startingCash: string;
  nameFailure: string | undefined;
  firstSessionDateFailure: string | undefined;
  startingCashFailure: string | undefined;
}

/** Creates the class that the form of a lecturer describes and opens its page, or answers with the reason that each field was not accepted. */
async function createClassFromForm(
  context: Readonly<RouterContextProvider>,
  request: Request,
  { lecturerId, now }: { lecturerId: UserId; now: Date },
) {
  const form = await request.formData();
  const name = parseShortText(
    form.get("name"),
    m.classes_name_label(),
    classNameMaximumLength,
  );
  const firstSessionDate = parseFirstSessionDate(
    form.get("firstSessionDate"),
    m.classes_first_session_label(),
    now,
  );
  const startingCash = parseStartingCash(
    form.get("startingCash"),
    m.classes_starting_cash_label(),
  );
  if (!name.ok || !firstSessionDate.ok || !startingCash.ok) {
    const fields: NewClassFailures = {
      name: typedText(form.get("name")),
      firstSessionDate: typedText(form.get("firstSessionDate")),
      startingCash: typedText(form.get("startingCash")),
      nameFailure: failureOf(name),
      firstSessionDateFailure: failureOf(firstSessionDate),
      startingCashFailure: failureOf(startingCash),
    };
    return data({ fields, failure: undefined }, { status: 400 });
  }
  const classId = createClass(
    context.get(databaseContext),
    {
      lecturerId,
      name: name.value,
      startingCash: startingCash.value,
      firstSessionDate: firstSessionDate.value,
    },
    now,
  );
  return redirect(classPath(classId));
}

export default function ClassesPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  // Only a student gets a failure above the form, from a page that loaded for a lecturer or from a forged form, so the page explains the refusal instead of the list.
  if (actionData?.failure !== undefined) {
    return (
      <>
        <PageTitle text={m.classes_lecturer_only_title()} />
        <ErrorPage
          title={m.classes_lecturer_only_title()}
          body={actionData.failure}
        />
      </>
    );
  }
  return (
    <>
      <PageTitle text={m.classes_page_title()} />
      <h1>{m.classes_page_title()}</h1>
      <ClassList role={loaderData.role} classes={listedClasses(loaderData)} />
      <NextStep role={loaderData.role} fields={actionData?.fields} />
    </>
  );
}

/** The classes of the page, each with the details that its reader needs: the students and the starting cash for a lecturer, and the lecturer for a student. */
function listedClasses(
  loaderData: Route.ComponentProps["loaderData"],
): ListedClass[] {
  switch (loaderData.role) {
    case "lecturer":
      return loaderData.classes.map((taught) => ({
        id: taught.id,
        name: taught.name,
        details: m.classes_taught_class_notice({
          count: formatNumber(taught.studentCount),
          cash: formatRupiah(taught.startingCash),
        }),
      }));
    case "student":
      return loaderData.classes.map((joined) => ({
        id: joined.id,
        name: joined.name,
        details: m.classes_taught_by_notice({ name: joined.lecturerName }),
      }));
  }
}

/** What a person does next on the page: a lecturer creates a class, and a student joins one. */
function NextStep({
  role,
  fields,
}: {
  role: Role;
  fields: NewClassFailures | undefined;
}): ReactNode {
  switch (role) {
    case "lecturer":
      return (
        <>
          <h2>{m.classes_create_title()}</h2>
          <NewClassForm fields={fields} />
        </>
      );
    case "student":
      return (
        <Link to="/join" className={styles["link"]}>
          {m.classes_join_link()}
        </Link>
      );
  }
}

/** The form with which a lecturer creates a class, with the values that the lecturer typed and why each was not accepted. */
function NewClassForm({
  fields,
}: {
  fields: NewClassFailures | undefined;
}): ReactNode {
  return (
    <Form method="post" noValidate className={formStyles["form"]}>
      <TextField
        name="name"
        label={m.classes_name_label()}
        type="text"
        autoComplete="off"
        capitalizesWords
        hint={m.classes_name_hint()}
        failure={fields?.nameFailure}
        defaultValue={fields?.name}
      />
      <FirstSessionField
        failure={fields?.firstSessionDateFailure}
        defaultValue={fields?.firstSessionDate}
      />
      <TextField
        name="startingCash"
        label={m.classes_starting_cash_label()}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        hint={m.classes_starting_cash_hint()}
        failure={fields?.startingCashFailure}
        defaultValue={fields?.startingCash ?? formatNumber(defaultStartingCash)}
      />
      <SubmitButton label={m.classes_create_label()} />
    </Form>
  );
}
