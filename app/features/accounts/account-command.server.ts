import type { Database } from "../../database/database.server.ts";
import { fail, failuresOf, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { parseChoice } from "../../value-parsers.ts";
import { describeValue, isStringArray } from "../../value-shapes.ts";
import {
  createLecturer,
  findAccountByUsername,
  resetPassword,
} from "./account-store.server.ts";
import { accountActions } from "./account-actions.ts";
import type { AccountAction } from "./account-actions.ts";
import { parseUsername } from "./username.ts";
import type { Username } from "./username.ts";

/** What the person who runs the server asked the account command to do. */
export interface AccountCommand {
  action: AccountAction;
  username: Username;
}

/** Reads the command line of the account command, which names an action and a username. */
export function parseAccountCommand(
  value: unknown,
  source: string,
): Result<AccountCommand, string> {
  if (!isStringArray(value) || value.length > 2) {
    return fail(
      `${source} must hold an action and a username, but it is ${describeValue(value)}.`,
    );
  }
  const [actionArgument, usernameArgument] = value;
  const action = parseChoice(actionArgument, "The action", accountActions);
  const username = parseUsername(usernameArgument, "The username");
  if (!action.ok || !username.ok) {
    return fail(failuresOf([action, username]).join(" "));
  }
  return succeed({ action: action.value, username: username.value });
}

/** Runs the account command and returns the text for the person who runs the server, with the temporary password that they pass on. */
export async function runAccountCommand(
  database: Database,
  command: AccountCommand,
): Promise<Result<string, string>> {
  const { username } = command;
  switch (command.action) {
    case "create-lecturer": {
      const temporaryPassword = await createLecturer(database, username);
      return temporaryPassword === undefined
        ? fail(
            `The username "${username}" is taken, so Portolab created no account. Choose another username, or give that account a new password with the action "reset-password".`,
          )
        : succeed(
            `Portolab created the lecturer account "${username}". Its temporary password is:\n\n  ${temporaryPassword}\n\nGive it to the lecturer, who signs in with it, gives a name, chooses a new password, and agrees to the privacy notice.`,
          );
    }
    case "reset-password": {
      const account = findAccountByUsername(database, username);
      if (account === undefined) {
        return fail(
          `Portolab has no account with the username "${username}". Check the username, or create a lecturer with the action "create-lecturer".`,
        );
      }
      const temporaryPassword = await resetPassword(database, account.id);
      return succeed(
        `Portolab signed the account "${username}" out on every device and gave it a temporary password:\n\n  ${temporaryPassword}\n\nGive it to the owner of the account, who signs in with it and chooses a new password. When wrong passwords blocked the account, the block lasts until the time that the sign-in page names, because the server keeps it apart from this command.`,
      );
    }
  }
}
