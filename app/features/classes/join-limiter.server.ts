import { createContext } from "react-router";
import { createAttemptLimiter } from "~/create-attempt-limiter.server";
import type { AttemptLimiter } from "~/create-attempt-limiter.server";

/** The limit on wrong codes from one address. A whole class often shares one address on a campus network, so it lets every student of a class mistype a few times, and it still makes guessing a code hopeless. */
export const joinLimit = { failures: 100, windowMinutes: 15 } as const;

export function createJoinLimiter(): AttemptLimiter {
  return createAttemptLimiter(joinLimit);
}

// The server keeps the limiter with its other services, so the dev server can reload this module after an edit without forgetting the attempts.
export const joinLimiterContext = createContext<AttemptLimiter>();
