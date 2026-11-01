import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import type { UserId } from "./accounts.schema";
import { resetPassword } from "./account-store.server";
import { passwordLimitersContext } from "./password-attempts.server";
import type { Username } from "./username";

/** Gives a person who forgot the password a temporary one, which this returns, and signs the person out on every device. It also forgets the wrong passwords of the username, so a person who reached their limit signs in with the temporary password at once. */
export async function resetForgottenPassword(
  context: Readonly<RouterContextProvider>,
  person: { id: UserId; username: Username },
): Promise<string> {
  const temporaryPassword = await resetPassword(
    context.get(databaseContext),
    person.id,
  );
  context.get(passwordLimitersContext).byUsername.forget(person.username);
  return temporaryPassword;
}
