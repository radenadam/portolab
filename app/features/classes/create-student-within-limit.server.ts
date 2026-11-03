import type { RouterContextProvider } from "react-router";
import { clientAddressContext } from "~/client-address.server";
import { databaseContext } from "~/database/database.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import { createStudent } from "~/features/accounts/account-store.server";
import type { NewStudent } from "~/features/accounts/account-store.server";
import { formatMarketClock, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { joinLimits, joinLimitersContext } from "./join-limiters.server";

/** Why the account of a student was not created: the network of the request reached the limit on new accounts, with the sentence for the reader in the current language, or the username is taken. */
export type NewStudentFailure =
  { kind: "blocked"; text: string } | { kind: "usernameTaken" };

/** Creates the account of a student who joins a class, within the limit on new accounts from the address of the request, and returns its id. Every request counts, also one whose username is taken, because each costs the hash of a password. */
export async function createStudentWithinLimit(
  context: Readonly<RouterContextProvider>,
  student: NewStudent,
  now: Date,
): Promise<Result<UserId, NewStudentFailure>> {
  const blockedUntil = context
    .get(joinLimitersContext)
    .newAccounts.startAttempt(context.get(clientAddressContext), now);
  if (blockedUntil !== undefined) {
    return fail({
      kind: "blocked",
      text: m.classes_new_accounts_blocked_error({
        time: formatMarketClock(blockedUntil),
        accounts: formatNumber(joinLimits.newAccounts.failures),
        minutes: formatNumber(joinLimits.newAccounts.windowMinutes),
      }),
    });
  }
  const studentId = await createStudent(
    context.get(databaseContext),
    student,
    now,
  );
  return studentId === undefined
    ? fail({ kind: "usernameTaken" })
    : succeed(studentId);
}
