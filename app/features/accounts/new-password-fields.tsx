import type { ReactNode } from "react";
import { TextField } from "~/form";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { passwordLength } from "./account-fields";
import type { NewPasswordFailures } from "./account-fields";

/** The fields of a new password, which a person types twice, so that a typing mistake never locks the person out. */
export function NewPasswordFields({
  failures,
}: {
  failures: NewPasswordFailures | undefined;
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
