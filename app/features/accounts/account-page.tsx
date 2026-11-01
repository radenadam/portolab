import type { ReactNode } from "react";
import { data, Form, Link } from "react-router";
import { clientAddressContext } from "~/client-address-context.server";
import { databaseContext } from "~/database/database.server";
import { FormFailure, FormSuccess, SubmitButton, TextField } from "~/form";
import formStyles from "~/form.module.css";
import { parseFilledText } from "~/form-text";
import { formatNumber } from "~/formatting";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/account-page";
import type { User } from "./account";
import { AccountDetails } from "./account-details";
import { parseNewPassword, parseRepeatedPassword } from "./account-fields";
import { NewPasswordFields } from "./account-form-fields";
import { updateAccount } from "./account-store.server";
import { requireUser, startSession } from "./current-session.server";
import {
  checkPassword,
  passwordLimitersContext,
} from "./password-attempts.server";
import { passwordFailureText } from "./password-failure-text.server";
import { passwordLimits } from "./account-limits";
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
  const newPassword = parseNewPassword(
    form.get("newPassword"),
    m.accounts_new_password_label(),
  );
  const repeatedPassword = newPassword.ok
    ? parseRepeatedPassword(
        form.get("repeatedPassword"),
        m.accounts_repeated_password_label(),
        newPassword.value,
      )
    : undefined;
  if (!currentPassword.ok || !newPassword.ok || repeatedPassword?.ok !== true) {
    return data(
      {
        savedAt: undefined,
        failure: undefined,
        currentPasswordFailure: currentPassword.ok
          ? undefined
          : currentPassword.failure,
        newPasswordFailure: newPassword.ok ? undefined : newPassword.failure,
        repeatedPasswordFailure:
          repeatedPassword?.ok === false ? repeatedPassword.failure : undefined,
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
    return data(
      {
        savedAt: undefined,
        failure: passwordFailureText(
          checked.failure,
          user.username,
          m.accounts_wrong_current_password_error({
            failures: formatNumber(passwordLimits.byUsername.failures),
            minutes: formatNumber(passwordLimits.byUsername.windowMinutes),
          }),
        ),
        currentPasswordFailure: undefined,
        newPasswordFailure: undefined,
        repeatedPasswordFailure: undefined,
      },
      { status: checked.failure.kind === "wrongPassword" ? 400 : 429 },
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
