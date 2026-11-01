import { formatMarketClock, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { PasswordFailure } from "./password-attempts.server";
import { passwordLimits } from "./account-limits";

/** The sentence that explains why a password was not accepted, with the limits that block guessing. The caller gives the sentence for a wrong password, because a sign-in cannot say whether the username or the password was wrong. */
export function passwordFailureText(
  failure: PasswordFailure,
  username: string,
  wrongPassword: string,
): string {
  switch (failure.kind) {
    case "wrongPassword":
      return wrongPassword;
    case "usernameBlocked":
      return m.accounts_username_blocked_error({
        username,
        time: formatMarketClock(failure.until),
        failures: formatNumber(passwordLimits.byUsername.failures),
        minutes: formatNumber(passwordLimits.byUsername.windowMinutes),
      });
    case "addressBlocked":
      return m.accounts_address_blocked_error({
        time: formatMarketClock(failure.until),
        failures: formatNumber(passwordLimits.byAddress.failures),
        minutes: formatNumber(passwordLimits.byAddress.windowMinutes),
      });
  }
}
