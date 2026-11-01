import type { ReactNode } from "react";
import { CheckboxField, TextField } from "~/form";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { AccountFormFailures } from "./account-fields";
import { PrivacyNotice } from "./privacy-notice";
import { usernameLength } from "./username";

export function NameField({
  hint,
  failures,
}: {
  hint: string;
  failures: Pick<AccountFormFailures, "name" | "nameFailure"> | undefined;
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
  failures:
    Pick<AccountFormFailures, "username" | "usernameFailure"> | undefined;
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
