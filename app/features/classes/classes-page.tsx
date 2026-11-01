import type { ReactNode } from "react";
import { data, Form, Link, redirect } from "react-router";
import { databaseContext } from "~/database/database.server";
import {
  requireLecturer,
  requireUser,
} from "~/features/accounts/current-session.server";
import { SubmitButton, TextField } from "~/form";
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
  const lecturer = requireLecturer(context, request);
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
    return data(
      {
        name: typedText(form.get("name")),
        startingCash: typedText(form.get("startingCash")),
        nameFailure: failureOf(name),
        startingCashFailure: failureOf(startingCash),
      },
      { status: 400 },
    );
  }
  const classId = createClass(
    context.get(databaseContext),
    {
      lecturerId: lecturer.id,
      name: name.value,
      startingCash: startingCash.value,
    },
    new Date(),
  );
  return redirect(`/classes/${String(classId)}`);
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
          <Form method="post" className={formStyles["form"]}>
            <TextField
              name="name"
              label={m.classes_name_label()}
              type="text"
              autoComplete="off"
              capitalizesWords
              hint={m.classes_name_hint()}
              failure={actionData?.nameFailure}
              defaultValue={actionData?.name}
            />
            <TextField
              name="startingCash"
              label={m.classes_starting_cash_label()}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              hint={m.classes_starting_cash_hint()}
              failure={actionData?.startingCashFailure}
              defaultValue={
                actionData?.startingCash ?? formatNumber(defaultStartingCash)
              }
            />
            <SubmitButton label={m.classes_create_label()} />
          </Form>
        </>
      );
    case "student":
      return (
        <>
          <h1>{m.classes_title()}</h1>
          <JoinedClasses classes={loaderData.classes} />
          <Link to="/join" className={styles["link"]}>
            {m.classes_join_link()}
          </Link>
        </>
      );
  }
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
          <Link to={`/classes/${String(taught.id)}`} className={styles["link"]}>
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
  // A student joins a class when the account is created, so the list of a student is never empty.
  return (
    <ul className={styles["list"]}>
      {classes.map((joined) => (
        <li key={joined.id} className={styles["item"]}>
          <Link to={`/classes/${String(joined.id)}`} className={styles["link"]}>
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
