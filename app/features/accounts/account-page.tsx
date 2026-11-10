import type { ReactNode } from "react";
import { data, Form, Link } from "react-router";
import type { RouterContextProvider } from "react-router";
import { clientAddressContext } from "~/client-address.server";
import { databaseContext } from "~/database/database.server";
import { FormFailure, FormSuccess, SubmitButton, TextField } from "~/form";
import formStyles from "~/form.module.css";
import { parseFilledText, typedText } from "~/form-text";
import { pageTitle } from "~/page-title";
import { failureOf } from "~/result";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/account-page";
import type { User } from "./account";
import { AccountDetails } from "./account-details";
import { parsePersonName, readNewPassword } from "./account-fields";
import type {
  AccountFormFailures,
  NewPasswordFailures,
} from "./account-fields";
import { NameField } from "./account-form-fields";
import { NewPasswordFields } from "./new-password-fields";
import { updateAccount } from "./account-store.server";
import {
  reloadSessionAccount,
  requireUser,
  startSession,
} from "./current-session.server";
import {
  checkPassword,
  passwordLimitersContext,
} from "./password-attempts.server";
import type { PasswordFailure } from "./password-attempts.server";
import { explainPasswordFailure } from "./explain-password-failure.server";
import { SignOutButton } from "./sign-out-button";
import styles from "./account-page.module.css";

/** The answer to the form of the name: whether Portolab saved the name, or the name as the person typed it with the reason that it does not follow the rule of names. */
interface NameAnswer {
  isSaved: boolean;
  failures: Pick<AccountFormFailures, "name" | "nameFailure"> | undefined;
}

/** The answer to the form of the password: when Portolab saved the password, so that the form starts over without it, or the reason that each field or the whole form was not accepted. */
interface PasswordAnswer extends NewPasswordFailures {
  savedAt: string | undefined;
  failure: string | undefined;
  currentPasswordFailure: string | undefined;
}

/** The answer to the form that the person sent. The page has a form for the name and a form for the password, and each shows only its own answer. */
interface AccountAnswer {
  name: NameAnswer | undefined;
  password: PasswordAnswer | undefined;
}

/** A form that the person who is signed in sent from the page of the account at a moment. */
interface AccountForm {
  user: User;
  form: FormData;
  now: Date;
}

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.accounts_account_title()) }];
}

export function loader({ context, url }: Route.LoaderArgs): {
  user: User;
} {
  return { user: requireUser(context, url) };
}

export async function action({
  context,
  request,
  url,
}: Route.ActionArgs): Promise<ReturnType<typeof data<AccountAnswer>>> {
  const now = new Date();
  const user = requireUser(context, url);
  const form = await request.formData();
  // The form of the name sends the name, and the form of the password never sends it.
  return form.has("name")
    ? changeName(context, url, { user, form, now })
    : changePassword(context, request, { user, form, now });
}

/** Saves the name that the person gave, when it follows the rule of every name. It asks for no password, as decision 0024 explains. */
async function changeName(
  context: Readonly<RouterContextProvider>,
  url: URL,
  { user, form }: AccountForm,
): Promise<ReturnType<typeof data<AccountAnswer>>> {
  const name = parsePersonName(form.get("name"), m.accounts_name_label());
  if (!name.ok) {
    return data(
      {
        name: {
          isSaved: false,
          failures: {
            name: typedText(form.get("name")),
            nameFailure: name.failure,
          },
        },
        password: undefined,
      },
      { status: 400 },
    );
  }
  await updateAccount(context.get(databaseContext), user.id, {
    name: name.value,
  });
  reloadSessionAccount(context, url);
  return data({
    name: { isSaved: true, failures: undefined },
    password: undefined,
  });
}

/** Saves a new password after a check of the current one, and continues on this device in a new session. */
async function changePassword(
  context: Readonly<RouterContextProvider>,
  request: Request,
  { user, form, now }: AccountForm,
): Promise<ReturnType<typeof data<AccountAnswer>>> {
  const currentPassword = parseFilledText(
    form.get("currentPassword"),
    m.accounts_current_password_label(),
  );
  const newPassword = readNewPassword(form);
  if (!currentPassword.ok || !newPassword.ok) {
    return data(
      {
        name: undefined,
        password: {
          savedAt: undefined,
          failure: undefined,
          currentPasswordFailure: failureOf(currentPassword),
          newPasswordFailure: failureOf(newPassword)?.newPasswordFailure,
          repeatedPasswordFailure:
            failureOf(newPassword)?.repeatedPasswordFailure,
        },
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
      now,
    },
  );
  if (!checked.ok) {
    const { text, status } = explainPasswordFailure(
      checked.failure,
      user.username,
      (limit) =>
        m.accounts_wrong_current_password_error({
          ...limit,
          field: m.accounts_current_password_label(),
        }),
    );
    return data(
      {
        name: undefined,
        password: {
          savedAt: undefined,
          ...placePasswordFailure(checked.failure, text),
          newPasswordFailure: undefined,
          repeatedPasswordFailure: undefined,
        },
      },
      { status },
    );
  }
  await updateAccount(database, user.id, { password: newPassword.value });
  // The new password ended every session of the account, so this device continues in a new one. The form starts over when it saved, so the passwords leave its fields.
  return data(
    {
      name: undefined,
      password: {
        savedAt: now.toISOString(),
        failure: undefined,
        currentPasswordFailure: undefined,
        newPasswordFailure: undefined,
        repeatedPasswordFailure: undefined,
      },
    },
    {
      headers: {
        "Set-Cookie": await startSession(database, request, {
          userId: user.id,
          now,
        }),
      },
    },
  );
}

/** Puts the text of a failed check of the current password where it belongs: a wrong password at its field, and a block of the limit on wrong passwords above the form. */
function placePasswordFailure(
  failure: PasswordFailure,
  text: string,
): { failure: string | undefined; currentPasswordFailure: string | undefined } {
  switch (failure.kind) {
    case "wrongPassword":
      return { failure: undefined, currentPasswordFailure: text };
    case "usernameBlocked":
    case "addressBlocked":
      return { failure: text, currentPasswordFailure: undefined };
  }
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
      <h2>{m.accounts_change_name_title()}</h2>
      <NameForm user={user} answer={actionData?.name} />
      <h2>{m.accounts_change_password_title()}</h2>
      <PasswordForm answer={actionData?.password} />
      <SignOutButton />
    </>
  );
}

/** The form that changes the name, which shows the name that Portolab stores until the person types another. */
function NameForm({
  user,
  answer,
}: {
  user: User;
  answer: NameAnswer | undefined;
}): ReactNode {
  return (
    // The form starts over when the stored name changes, so that the field shows the name as the rule of names saved it.
    <Form key={user.name} method="post" className={formStyles["form"]}>
      {answer?.isSaved === true && (
        <FormSuccess text={m.accounts_name_changed_notice()} />
      )}
      <NameField
        accountRole={user.role}
        failures={
          answer?.failures ?? { name: user.name, nameFailure: undefined }
        }
      />
      <SubmitButton label={m.accounts_change_name_label()} />
    </Form>
  );
}

/** The form that changes the password, which asks for the current one first. */
function PasswordForm({
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
