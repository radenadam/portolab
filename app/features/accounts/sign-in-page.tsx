import type { ReactNode } from "react";
import { data, Form, redirect } from "react-router";
import { clientAddressContext } from "~/client-address.server";
import { databaseContext } from "~/database/database.server";
import { FormFailure, SubmitButton, TextField } from "~/form";
import formStyles from "~/form.module.css";
import { parseFilledText, typedText } from "~/form-text";
import { pageTitle } from "~/page-title";
import { failureOf } from "~/result";
import { m } from "~/paraglide/messages.js";
import { returnDestination } from "~/return-destination.server";
import type { Route } from "./+types/sign-in-page";
import { readyUser } from "./account";
import {
  currentSessionContext,
  isSignedIn,
  pathReturningTo,
  startSession,
} from "./current-session.server";
import { passwordLimitersContext, signIn } from "./password-attempts.server";
import { explainPasswordFailure } from "./explain-password-failure.server";
import { deleteSession } from "./session-store.server";
import { normalizeUsername } from "./username";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.accounts_sign_in_title()) }];
}

export function loader({ context, request }: Route.LoaderArgs): {
  returnTo: string;
} {
  const returnTo = new URL(request.url).searchParams.get("returnTo");
  if (isSignedIn(context)) {
    throw redirect(returnDestination(returnTo, request));
  }
  return { returnTo: returnTo ?? "" };
}

export async function action({ context, request }: Route.ActionArgs) {
  const form = await request.formData();
  const username = parseFilledText(
    form.get("username"),
    m.accounts_username_label(),
  );
  const password = parseFilledText(
    form.get("password"),
    m.accounts_password_label(),
  );
  if (!username.ok || !password.ok) {
    return data(
      {
        username: typedText(form.get("username")),
        usernameFailure: failureOf(username),
        passwordFailure: failureOf(password),
        failure: undefined,
      },
      { status: 400 },
    );
  }
  const database = context.get(databaseContext);
  const signedIn = await signIn(
    database,
    context.get(passwordLimitersContext),
    {
      username: username.value,
      password: password.value,
      address: context.get(clientAddressContext),
      now: new Date(),
    },
  );
  if (!signedIn.ok) {
    const { text, status } = explainPasswordFailure(
      signedIn.failure,
      normalizeUsername(username.value),
      m.accounts_wrong_credentials_error,
    );
    return data(
      {
        username: username.value,
        usernameFailure: undefined,
        passwordFailure: undefined,
        failure: text,
      },
      { status },
    );
  }
  // A session that the device still holds ends here, so it never stays behind for the next person on a shared computer.
  const previousSession = context.get(currentSessionContext);
  if (previousSession !== undefined) {
    deleteSession(database, previousSession.id);
  }
  const destination = returnDestination(form.get("returnTo"), request);
  return redirect(
    readyUser(signedIn.value) === undefined
      ? pathReturningTo("/account/setup", destination)
      : destination,
    {
      headers: {
        "Set-Cookie": await startSession(database, request, signedIn.value.id),
      },
    },
  );
}

export default function SignInPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  return (
    <>
      <h1>{m.accounts_sign_in_title()}</h1>
      <Form method="post" className={formStyles["form"]}>
        <input type="hidden" name="returnTo" value={loaderData.returnTo} />
        {actionData?.failure !== undefined && (
          <FormFailure text={actionData.failure} />
        )}
        <TextField
          name="username"
          label={m.accounts_username_label()}
          type="text"
          autoComplete="username"
          defaultValue={actionData?.username}
          failure={actionData?.usernameFailure}
        />
        <TextField
          name="password"
          label={m.accounts_password_label()}
          type="password"
          autoComplete="current-password"
          failure={actionData?.passwordFailure}
        />
        <SubmitButton label={m.accounts_sign_in_label()} />
      </Form>
      <p>{m.accounts_forgot_password_notice()}</p>
    </>
  );
}
