import { formatMarketClock, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { passwordLimits } from "./account-limits";
import type { PasswordFailure } from "./password-attempts.server";

/** A message that states the limit on wrong passwords for a username. */
type LimitMessage = (inputs: { failures: string; minutes: string }) => string;

/** The sentence that explains why a password was not accepted, with the limits that block guessing, and the status of the answer. The caller gives the message for a wrong password, because a sign-in cannot say whether the username or the password was wrong. */
export function explainPasswordFailure(
  failure: PasswordFailure,
  username: string,
  wrongPassword: LimitMessage,
): { text: string; status: 400 | 429 } {
  const usernameLimit = {
    failures: formatNumber(passwordLimits.byUsername.failures),
    minutes: formatNumber(passwordLimits.byUsername.windowMinutes),
  };
  switch (failure.kind) {
    case "wrongPassword":
      return { text: wrongPassword(usernameLimit), status: 400 };
    case "usernameBlocked":
      return {
        text: m.accounts_username_blocked_error({
          username,
          time: formatMarketClock(failure.until),
          ...usernameLimit,
        }),
        status: 429,
      };
    case "addressBlocked":
      return {
        text: m.accounts_address_blocked_error({
          time: formatMarketClock(failure.until),
          failures: formatNumber(passwordLimits.byAddress.failures),
          minutes: formatNumber(passwordLimits.byAddress.windowMinutes),
        }),
        status: 429,
      };
  }
}
