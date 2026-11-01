import type { ReactNode } from "react";
import { data, Form, Link, redirect } from "react-router";
import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import { requireUser } from "~/features/accounts/current-session.server";
import { FormFailure, SubmitButton, TextField } from "~/form";
import formStyles from "~/form.module.css";
import { parseShortText, typedText } from "~/form-text";
import { formatNumber, formatRupiah } from "~/formatting";
import { pageTitle } from "~/page-title";
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
import styles from "./classes.module.css";
import { parseStartingCash } from "./parse-starting-cash";
import { classNameMaximumLength, defaultStartingCash } from "./class-rules";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.classes_title()) }];
}

export function loader({
  context,
  request,
}: Route.LoaderArgs):
  | { role: "lecturer"; classes: TaughtClass[] }
  | { role: "student"; classes: JoinedClass[] } {
  const user = requireUser(context, request);
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

export async function action({ context, request }: Route.ActionArgs) {
  const user = requireUser(context, request);
  switch (user.role) {
    case "lecturer":
      return createClassFromForm(context, request, {
        lecturerId: user.id,
        now: new Date(),
      });
    case "student":
      // The page of a student has no form for a class, so only a forged form comes here, and the page says why it refused.
      return data(
        { fields: undefined, refusal: m.classes_lecturer_only_error() },
        { status: 403 },
      );
  }
}

/** Why the fields of the form that creates a class were not accepted, with their values as the lecturer typed them, so the form can show them again. */
interface NewClassFailures {
  name: string;
  startingCash: string;
  nameFailure: string | undefined;
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
  const startingCash = parseStartingCash(
    form.get("startingCash"),
    m.classes_starting_cash_label(),
  );
  if (!name.ok || !startingCash.ok) {
    const fields: NewClassFailures = {
      name: typedText(form.get("name")),
      startingCash: typedText(form.get("startingCash")),
      nameFailure: failureOf(name),
      startingCashFailure: failureOf(startingCash),
    };
    return data({ fields, refusal: undefined }, { status: 400 });
  }
  const classId = createClass(
    context.get(databaseContext),
    { lecturerId, name: name.value, startingCash: startingCash.value },
    now,
  );
  return redirect(classPath(classId));
}

export default function ClassesPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  switch (loaderData.role) {
    case "lecturer":
      return (
        <>
          <h1>{m.classes_title()}</h1>
          <TaughtClasses classes={loaderData.classes} />
          <h2>{m.classes_create_title()}</h2>
          <NewClassForm fields={actionData?.fields} />
        </>
      );
    case "student":
      return (
        <>
          <h1>{m.classes_title()}</h1>
          {actionData?.refusal !== undefined && (
            <FormFailure text={actionData.refusal} />
          )}
          <JoinedClasses classes={loaderData.classes} />
          <Link to="/join" className={styles["link"]}>
            {m.classes_join_link()}
          </Link>
        </>
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
    <Form method="post" className={formStyles["form"]}>
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

function TaughtClasses({
  classes,
}: {
  classes: readonly TaughtClass[];
}): ReactNode {
  if (classes.length === 0) {
    return <p>{m.classes_no_taught_classes_body()}</p>;
  }
  return (
    <ul className={styles["list"]}>
      {classes.map((taught) => (
        <li key={taught.id} className={styles["item"]}>
          <Link to={classPath(taught.id)} className={styles["link"]}>
            {taught.name}
          </Link>
          <p className={styles["details"]}>
            {m.classes_taught_class_notice({
              count: formatNumber(taught.studentCount),
              cash: formatRupiah(taught.startingCash),
            })}
          </p>
        </li>
      ))}
    </ul>
  );
}

function JoinedClasses({
  classes,
}: {
  classes: readonly JoinedClass[];
}): ReactNode {
  // A student account exists only through joining a class, and nothing deletes a class yet, so the list of a student is never empty. Issue #27 adds deletion and with it the empty list.
  return (
    <ul className={styles["list"]}>
      {classes.map((joined) => (
        <li key={joined.id} className={styles["item"]}>
          <Link to={classPath(joined.id)} className={styles["link"]}>
            {joined.name}
          </Link>
          <p className={styles["details"]}>
            {m.classes_taught_by_notice({ name: joined.lecturerName })}
          </p>
        </li>
      ))}
    </ul>
  );
}
