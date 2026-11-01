import type { ReactNode } from "react";
import { data, Form, Link } from "react-router";
import { clientAddressContext } from "~/client-address.server";
import { databaseContext } from "~/database/database.server";
import { FormFailure, FormSuccess, SubmitButton, TextField } from "~/form";
import formStyles from "~/form.module.css";
import { parseFilledText } from "~/form-text";
import { pageTitle } from "~/page-title";
import { failureOf } from "~/result";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/account-page";
import type { User } from "./account";
import { AccountDetails } from "./account-details";
import { readNewPassword } from "./account-fields";
import { NewPasswordFields } from "./new-password-fields";
import { updateAccount } from "./account-store.server";
import { requireUser, startSession } from "./current-session.server";
import {
  checkPassword,
  passwordLimitersContext,
} from "./password-attempts.server";
import { explainPasswordFailure } from "./explain-password-failure.server";
import { SignOutButton } from "./sign-out-button";
import styles from "./account-page.module.css";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.accounts_account_title()) }];
}

export function loader({ context, request }: Route.LoaderArgs): {
  user: User;
} {
  return { user: requireUser(context, request) };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = requireUser(context, request);
  const form = await request.formData();
  const currentPassword = parseFilledText(
    form.get("currentPassword"),
    m.accounts_current_password_label(),
  );
  const newPassword = readNewPassword(form);
  if (!currentPassword.ok || !newPassword.ok) {
    return data(
      {
        savedAt: undefined,
        failure: undefined,
        currentPasswordFailure: failureOf(currentPassword),
        newPasswordFailure: failureOf(newPassword)?.newPasswordFailure,
        repeatedPasswordFailure:
          failureOf(newPassword)?.repeatedPasswordFailure,
      },
      { status: 400 },
    );
  }
  const database = context.get(databaseContext);
  const checked = await checkPassword(
    database,
    context.get(passwordLimitersContext),
    {
      userId: user.id,
      username: user.username,
      password: currentPassword.value,
      address: context.get(clientAddressContext),
      now: new Date(),
    },
  );
  if (!checked.ok) {
    const { text, status } = explainPasswordFailure(
      checked.failure,
      user.username,
      m.accounts_wrong_current_password_error,
    );
    return data(
      {
        savedAt: undefined,
        failure: text,
        currentPasswordFailure: undefined,
        newPasswordFailure: undefined,
        repeatedPasswordFailure: undefined,
      },
      { status },
    );
  }
  await updateAccount(database, user.id, { password: newPassword.value });
  // The new password ended every session of the account, so this device continues in a new one. The form starts over when it saved, so the passwords leave its fields.
  return data(
    {
      savedAt: new Date().toISOString(),
      failure: undefined,
      currentPasswordFailure: undefined,
      newPasswordFailure: undefined,
      repeatedPasswordFailure: undefined,
    },
    {
      headers: {
        "Set-Cookie": await startSession(database, request, user.id),
      },
    },
  );
}

export default function AccountPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { user } = loaderData;
  return (
    <>
      <h1>{m.accounts_account_title()}</h1>
      <AccountDetails user={user} />
      <p>
        <Link to="/privacy" className={styles["link"]}>
          {m.accounts_privacy_link()}
        </Link>
      </p>
      <h2>{m.accounts_change_password_title()}</h2>
      <Form
        key={actionData?.savedAt ?? "unsaved"}
        method="post"
        className={formStyles["form"]}
      >
        {actionData?.savedAt !== undefined && (
          <FormSuccess text={m.accounts_password_changed_notice()} />
        )}
        {actionData?.failure !== undefined && (
          <FormFailure text={actionData.failure} />
        )}
        <TextField
          name="currentPassword"
          label={m.accounts_current_password_label()}
          type="password"
          autoComplete="current-password"
          failure={actionData?.currentPasswordFailure}
        />
        <NewPasswordFields failures={actionData} />
        <SubmitButton label={m.accounts_change_password_label()} />
      </Form>
      <SignOutButton />
    </>
  );
}
