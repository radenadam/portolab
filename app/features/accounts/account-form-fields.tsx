import type { ReactNode } from "react";
import { CheckboxField, TextField } from "~/form";
import { m } from "~/paraglide/messages.js";
import { usernameRule } from "./account-fields";
import type { AccountFormFailures } from "./account-fields";
import type { Role } from "./accounts.schema";
import { PrivacyNotice } from "./privacy-notice";

const nameHints: Record<Role, () => string> = {
  lecturer: m.accounts_lecturer_name_hint,
  student: m.accounts_student_name_hint,
};

/** The field of the name of a person, with a hint that says who sees the name of a person with the role of the account. It shows the name of the failures, which is the name as the person typed it, or the name that the form starts with, such as the stored name on the page of the account. */
export function NameField({
  accountRole,
  failures,
}: {
  accountRole: Role;
  failures: Pick<AccountFormFailures, "name" | "nameFailure"> | undefined;
}): ReactNode {
  return (
    <TextField
      name="name"
      label={m.accounts_name_label()}
      type="text"
      autoComplete="name"
      capitalizesWords
      hint={nameHints[accountRole]()}
      failure={failures?.nameFailure}
      defaultValue={failures?.name}
    />
  );
}

export function UsernameField({
  failures,
}: {
  failures:
    Pick<AccountFormFailures, "username" | "usernameFailure"> | undefined;
}): ReactNode {
  return (
    <TextField
      name="username"
      label={m.accounts_username_label()}
      type="text"
      autoComplete="username"
      hint={m.accounts_username_hint(usernameRule())}
      failure={failures?.usernameFailure}
      defaultValue={failures?.username}
    />
  );
}

// The person agrees to the whole notice, so the form shows all of it before the box.
export function ConsentField({
  failures,
}: {
  failures: Pick<AccountFormFailures, "consentFailure"> | undefined;
}): ReactNode {
  return (
    <>
      <PrivacyNotice />
      <CheckboxField
        name="consent"
        label={m.accounts_consent_label()}
        failure={failures?.consentFailure}
      />
    </>
  );
}
