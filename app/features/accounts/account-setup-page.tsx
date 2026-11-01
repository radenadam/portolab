import type { ReactNode } from "react";
import { data, Form, redirect } from "react-router";
import { databaseContext } from "~/database/database.server";
import { CheckboxField, SubmitButton, TextField } from "~/form";
import formStyles from "~/form.module.css";
import { formatNumber } from "~/formatting";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { returnDestination } from "~/return-destination.server";
import type { Route } from "./+types/account-setup-page";
import { readyUser } from "./account";
import type { Account } from "./account";
import {
  parseConsent,
  parseNewPassword,
  parsePersonName,
  parseRepeatedPassword,
  passwordLength,
} from "./account-fields";
import { updateAccount } from "./account-store.server";
import type { AccountChanges } from "./account-store.server";
import { requireSession, startSession } from "./current-session.server";
import { PrivacyNotice } from "./privacy-notice";

/** The steps that an account still needs before Portolab serves the person. */
interface MissingSteps {
  name: boolean;
  password: boolean;
  consent: boolean;
}

function missingSteps(account: Account): MissingSteps {
  return {
    name: account.name === null,
    password: account.mustChangePassword,
    consent: account.consentedAt === null,
  };
}

// A lecturer whom the server owner created still lacks a name and consent, while a person whose password was reset only needs a new password.
function isFirstSetup(steps: MissingSteps): boolean {
  return steps.name || steps.consent;
}

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: pageTitle(
        isFirstSetup(loaderData.steps)
          ? m.accounts_first_setup_title()
          : m.accounts_new_password_title(),
      ),
    },
  ];
}

export function loader({ context, request }: Route.LoaderArgs): {
  steps: MissingSteps;
  returnTo: string;
} {
  const session = requireSession(context, request);
  const returnTo = new URL(request.url).searchParams.get("returnTo");
  if (readyUser(session.account) !== undefined) {
    throw redirect(returnDestination(returnTo, request));
  }
  return { steps: missingSteps(session.account), returnTo: returnTo ?? "" };
}

export async function action({ context, request }: Route.ActionArgs) {
  const session = requireSession(context, request);
  const form = await request.formData();
  const destination = returnDestination(form.get("returnTo"), request);
  if (readyUser(session.account) !== undefined) {
    return redirect(destination);
  }
  const changes = readSetupForm(form, missingSteps(session.account));
  if (!changes.ok) {
    return data(changes.failure, { status: 400 });
  }
  const database = context.get(databaseContext);
  await updateAccount(database, session.account.id, changes.value);
  if (changes.value.password === undefined) {
    return redirect(destination);
  }
  // A new password ended every session of the account, so the person continues in a new one.
  return redirect(destination, {
    headers: {
      "Set-Cookie": await startSession(database, request, session.account.id),
    },
  });
}

/** The reason that each field of the form was not accepted, and the name as the person typed it, so the form can show it again. */
interface SetupFailures {
  name: string;
  nameFailure: string | undefined;
  newPasswordFailure: string | undefined;
  repeatedPasswordFailure: string | undefined;
  consentFailure: string | undefined;
}

/** Reads each field that the account still lacks. */
function readSetupForm(
  form: FormData,
  steps: MissingSteps,
): Result<AccountChanges, SetupFailures> {
  const name = readWhenMissing(steps.name, () =>
    parsePersonName(form.get("name"), m.accounts_name_label()),
  );
  const password = readWhenMissing(steps.password, () =>
    parseNewPassword(form.get("newPassword"), m.accounts_new_password_label()),
  );
  const repeatedPassword =
    password.ok && password.value !== undefined
      ? parseRepeatedPassword(
          form.get("repeatedPassword"),
          m.accounts_repeated_password_label(),
          password.value,
        )
      : succeed(undefined);
  const consent = readWhenMissing(steps.consent, () =>
    parseConsent(form.get("consent"), m.accounts_consent_label()),
  );
  if (!name.ok || !password.ok || !repeatedPassword.ok || !consent.ok) {
    const typedName = form.get("name");
    return fail({
      name: typeof typedName === "string" ? typedName : "",
      nameFailure: failureOf(name),
      newPasswordFailure: failureOf(password),
      repeatedPasswordFailure: failureOf(repeatedPassword),
      consentFailure: failureOf(consent),
    });
  }
  return succeed({
    ...(name.value === undefined ? {} : { name: name.value }),
    ...(password.value === undefined ? {} : { password: password.value }),
    ...(consent.value === undefined ? {} : { consentedAt: new Date() }),
  });
}

function readWhenMissing<Value>(
  isMissing: boolean,
  read: () => Result<Value, string>,
): Result<Value | undefined, string> {
  return isMissing ? read() : succeed(undefined);
}

function failureOf(result: Result<unknown, string>): string | undefined {
  return result.ok ? undefined : result.failure;
}

export default function AccountSetupPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { steps, returnTo } = loaderData;
  const firstSetup = isFirstSetup(steps);
  return (
    <>
      <h1>
        {firstSetup
          ? m.accounts_first_setup_title()
          : m.accounts_new_password_title()}
      </h1>
      <p>
        {firstSetup
          ? m.accounts_first_setup_body()
          : m.accounts_new_password_body()}
      </p>
      <Form method="post" className={formStyles["form"]}>
        <input type="hidden" name="returnTo" value={returnTo} />
        {steps.name && (
          <TextField
            name="name"
            label={m.accounts_name_label()}
            type="text"
            autoComplete="name"
            capitalizesWords
            hint={m.accounts_lecturer_name_hint()}
            failure={actionData?.nameFailure}
            defaultValue={actionData?.name}
          />
        )}
        {steps.password && (
          <>
            <TextField
              name="newPassword"
              label={m.accounts_new_password_label()}
              type="password"
              autoComplete="new-password"
              hint={m.accounts_password_hint({
                minimum: formatNumber(passwordLength.minimum),
              })}
              failure={actionData?.newPasswordFailure}
            />
            <TextField
              name="repeatedPassword"
              label={m.accounts_repeated_password_label()}
              type="password"
              autoComplete="new-password"
              failure={actionData?.repeatedPasswordFailure}
            />
          </>
        )}
        {/* The person agrees to the whole notice, so the page shows all of it before the box. */}
        {steps.consent && (
          <>
            <PrivacyNotice />
            <CheckboxField
              name="consent"
              label={m.accounts_consent_label()}
              failure={actionData?.consentFailure}
            />
          </>
        )}
        <SubmitButton label={m.accounts_finish_label()} />
      </Form>
    </>
  );
}
