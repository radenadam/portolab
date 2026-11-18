import type { ReactNode } from "react";
import { Form } from "react-router";
import { FormFailure, FormSuccess, SubmitButton, TextField } from "~/form";
import formStyles from "~/form.module.css";
import { m } from "~/paraglide/messages.js";
import type { NewPasswordFailures } from "./account-fields";
import { NewPasswordFields } from "./new-password-fields";

/** The answer to the form of the password: when Portolab saved the password, so that the form starts over without it, or the reason that each field or the whole form was not accepted. */
export interface PasswordAnswer extends NewPasswordFailures {
  savedAt: string | undefined;
  failure: string | undefined;
  currentPasswordFailure: string | undefined;
}

/** The form that changes the password, which asks for the current one first. */
export function AccountPasswordForm({
  answer,
}: {
  answer: PasswordAnswer | undefined;
}): ReactNode {
  return (
    <Form
      key={answer?.savedAt ?? "unsaved"}
      method="post"
      className={formStyles["form"]}
    >
      {answer?.savedAt !== undefined && (
        <FormSuccess text={m.accounts_password_changed_notice()} />
      )}
      {answer?.failure !== undefined && <FormFailure text={answer.failure} />}
      <TextField
        name="currentPassword"
        label={m.accounts_current_password_label()}
        type="password"
        autoComplete="current-password"
        failure={answer?.currentPasswordFailure}
      />
      <NewPasswordFields failures={answer} />
      <SubmitButton label={m.accounts_change_password_label()} />
    </Form>
  );
}
