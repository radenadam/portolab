import type { ReactNode } from "react";
import { data, Link, redirect } from "react-router";
import type { RouterContextProvider } from "react-router";
import { clientAddressContext } from "~/client-address.server";
import { databaseContext } from "~/database/database.server";
import { FormFailure } from "~/form";
import formStyles from "~/form.module.css";
import { parseFilledText, typedText } from "~/form-text";
import { pageTitle } from "~/page-title";
import { failureOf } from "~/result";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/account-page";
import type { User } from "./account";
import { listReaderClasses } from "~/features/classes/class-store.server";
import { ClassNimForm } from "~/features/classes/class-nim-form";
import { changeStudentNim } from "~/features/classes/change-student-nim.server";
import type { NimAnswer } from "~/features/classes/change-student-nim.server";
import { AccountDetails } from "./account-details";
import { parsePersonName, readNewPassword } from "./account-fields";
import { AccountNameForm } from "./account-name-form";
import type { NameAnswer } from "./account-name-form";
import { AccountPasswordForm } from "./account-password-form";
import type { PasswordAnswer } from "./account-password-form";
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

/** The answer to the form that the person sent. Each form shows only its own answer, and the page shows why it refused a form that the reader may not send. */
interface AccountAnswer {
  nim: NimAnswer | undefined;
  name: NameAnswer | undefined;
  password: PasswordAnswer | undefined;
  failure: string | undefined;
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

export function loader({ context, url }: Route.LoaderArgs) {
  const user = requireUser(context, url);
  const readerClasses = listReaderClasses(context.get(databaseContext), user);
  return {
    user,
    joined: readerClasses.role === "student" ? readerClasses.classes : [],
  };
}

export async function action({
  context,
  request,
  url,
}: Route.ActionArgs): Promise<ReturnType<typeof data<AccountAnswer>>> {
  const now = new Date();
  const user = requireUser(context, url);
  const form = await request.formData();
  if (form.has("nim")) return changeNim(context, url, { user, form, now });
  // The form of the name sends the name, and the form of the password never sends it.
  return form.has("name")
    ? changeName(context, url, { user, form, now })
    : changePassword(context, request, { user, form, now });
}

/** Saves the NIM that a student gave for a class, when it follows the rule of a NIM. */
function changeNim(
  context: Readonly<RouterContextProvider>,
  url: URL,
  { user, form, now }: AccountForm,
): ReturnType<typeof data<AccountAnswer>> {
  const answerWith = (nim: NimAnswer, status: number) =>
    data<AccountAnswer>(
      { name: undefined, password: undefined, nim, failure: undefined },
      { status },
    );
  switch (user.role) {
    case "lecturer":
      // The page of a lecturer has no form of a NIM, so a form comes here only from a page that loaded before a lecturer signed in, or from a forged one, and the page says why it refused.
      return data<AccountAnswer>(
        {
          name: undefined,
          password: undefined,
          nim: undefined,
          failure: m.accounts_nim_lecturer_error(),
        },
        { status: 403 },
      );
    case "student": {
      const change = changeStudentNim(context.get(databaseContext), {
        studentId: user.id,
        form,
        now,
      });
      switch (change.kind) {
        case "saved":
          return answerWith(change.answer, 200);
        case "refused":
          return answerWith(change.answer, 400);
        case "notJoined":
          // The class or the place of the student in it went away since the page loaded, or a forged form named another class, so the page loads again with the classes that the student is in.
          throw redirect(url.pathname);
      }
    }
  }
}

/** Saves the name that the person gave, when it follows the rule of every name. It asks for no password, as decision 0024 explains. */
async function changeName(
  context: Readonly<RouterContextProvider>,
  url: URL,
  { user, form, now }: AccountForm,
): Promise<ReturnType<typeof data<AccountAnswer>>> {
  const name = parsePersonName(form.get("name"), m.accounts_name_label());
  if (!name.ok) {
    return data(
      {
        name: {
          savedAt: undefined,
          field: {
            name: typedText(form.get("name")),
            nameFailure: name.failure,
          },
        },
        password: undefined,
        nim: undefined,
        failure: undefined,
      },
      { status: 400 },
    );
  }
  await updateAccount(context.get(databaseContext), user.id, {
    name: name.value,
  });
  reloadSessionAccount(context, url);
  return data({
    name: {
      savedAt: now.toISOString(),
      field: { name: name.value, nameFailure: undefined },
    },
    password: undefined,
    nim: undefined,
    failure: undefined,
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
        nim: undefined,
        failure: undefined,
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
        nim: undefined,
        failure: undefined,
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
      nim: undefined,
      failure: undefined,
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
    <div className={formStyles["formColumn"]} data-layout="reading">
      <h1>{m.accounts_account_title()}</h1>
      {actionData?.failure !== undefined && (
        <FormFailure text={actionData.failure} />
      )}
      <section className={formStyles["panel"]}>
        <AccountDetails user={user} />
        <Link to="/privacy" className={formStyles["link"]}>
          {m.accounts_privacy_link()}
        </Link>
      </section>
      <section className={formStyles["panel"]}>
        <h2>{m.accounts_change_name_title()}</h2>
        <AccountNameForm user={user} answer={actionData?.name} />
      </section>
      {loaderData.joined.map((joined) => (
        <ClassNimForm
          key={joined.id}
          joined={joined}
          answer={actionData?.nim}
        />
      ))}
      <section className={formStyles["panel"]}>
        <h2>{m.accounts_change_password_title()}</h2>
        <AccountPasswordForm answer={actionData?.password} />
      </section>
      <SignOutButton />
    </div>
  );
}
