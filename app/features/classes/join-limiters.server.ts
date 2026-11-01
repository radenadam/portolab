import { createContext } from "react-router";
import { createAttemptLimiter } from "~/create-attempt-limiter.server";
import type { AttemptLimiter } from "~/create-attempt-limiter.server";
import { addressWindowMinutes } from "~/features/accounts/account-limits";

/** The limits on joining from the address of one network. A whole class often shares one address on a campus network, so each limit lets every student of a class join and mistype a few times. The limit on wrong codes still makes guessing a code hopeless. The limit on new accounts counts every account that a code opens the form for, because each costs the hash of a password, so a flood of accounts cannot take the time of the server. */
export const joinLimits = {
  wrongCodes: { failures: 100, windowMinutes: addressWindowMinutes },
  newAccounts: { failures: 200, windowMinutes: addressWindowMinutes },
} as const;

/** The counts of the limits on joining, which live as long as the server. */
export interface JoinLimiters {
  wrongCodes: AttemptLimiter;
  newAccounts: AttemptLimiter;
}

export function createJoinLimiters(): JoinLimiters {
  return {
    wrongCodes: createAttemptLimiter(joinLimits.wrongCodes),
    newAccounts: createAttemptLimiter(joinLimits.newAccounts),
  };
}

// The server keeps the limiters with its other services, so the dev server can reload this module after an edit without forgetting the attempts.
export const joinLimitersContext = createContext<JoinLimiters>();
