import type { ReactNode } from "react";
import { Form, Link, useLocation } from "react-router";
import type { AccountFormFailures } from "~/features/accounts/account-fields";
import {
  ConsentField,
  NameField,
  UsernameField,
} from "~/features/accounts/account-form-fields";
import { NewPasswordFields } from "~/features/accounts/new-password-fields";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import { FormFailure, SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import { formatRupiah } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { ClassForStudents } from "./class-store.server";
import styles from "./classes.module.css";

/** A class that a code opens, with the button that joins it for a student who is signed in, or the form that creates the account of a student for a visitor. */
export function ClassToJoin({
  classToJoin,
  isSignedIn,
  fields,
  failure,
}: {
  classToJoin: ClassForStudents;
  isSignedIn: boolean;
  fields: AccountFormFailures | undefined;
  failure: string | undefined;
}): ReactNode {
  return (
    <>
      <h1>{m.classes_join_class_title({ class: classToJoin.name })}</h1>
      <p>
        {m.classes_join_class_body({
          lecturer: classToJoin.lecturerName,
          cash: formatRupiah(classToJoin.startingCash),
        })}
      </p>
      {isSignedIn ? (
        <Form method="post" className={formStyles["form"]}>
          <input type="hidden" name="signedIn" value="yes" />
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
        <NameField accountRole="student" failures={fields} />
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
