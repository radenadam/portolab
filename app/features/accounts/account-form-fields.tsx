import type { ReactNode } from "react";
import { CheckboxField, TextField } from "~/form";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { passwordLength } from "./account-fields";
import type { AccountFormFailures } from "./account-fields";
import { PrivacyNotice } from "./privacy-notice";
import { usernameLength } from "./username";

export function NameField({
  hint,
  failures,
}: {
  hint: string;
  failures: AccountFormFailures | undefined;
}): ReactNode {
  return (
    <TextField
      name="name"
      label={m.accounts_name_label()}
      type="text"
      autoComplete="name"
      capitalizesWords
      hint={hint}
      failure={failures?.nameFailure}
      defaultValue={failures?.name}
    />
  );
}

export function UsernameField({
  failures,
}: {
  failures: AccountFormFailures | undefined;
}): ReactNode {
  return (
    <TextField
      name="username"
      label={m.accounts_username_label()}
      type="text"
      autoComplete="username"
      hint={m.accounts_username_hint({
        minimum: formatNumber(usernameLength.minimum),
        maximum: formatNumber(usernameLength.maximum),
      })}
      failure={failures?.usernameFailure}
      defaultValue={failures?.username}
    />
  );
}

/** The fields of a new password, which a person types twice, so that a typing mistake never locks the person out. */
export function NewPasswordFields({
  failures,
}: {
  failures:
    | Pick<
        AccountFormFailures,
        "newPasswordFailure" | "repeatedPasswordFailure"
      >
    | undefined;
}): ReactNode {
  return (
    <>
      <TextField
        name="newPassword"
        label={m.accounts_new_password_label()}
        type="password"
        autoComplete="new-password"
        hint={m.accounts_password_hint({
          minimum: formatNumber(passwordLength.minimum),
        })}
        failure={failures?.newPasswordFailure}
      />
      <TextField
        name="repeatedPassword"
        label={m.accounts_repeated_password_label()}
        type="password"
        autoComplete="new-password"
        failure={failures?.repeatedPasswordFailure}
      />
    </>
  );
}

// The person agrees to the whole notice, so the form shows all of it before the box.
export function ConsentField({
  failures,
}: {
  failures: AccountFormFailures | undefined;
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
