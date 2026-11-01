/** How many failed attempts a key may make within a window of time before it is blocked. */
export interface AttemptLimit {
  failures: number;
  windowMinutes: number;
}

/** Counts the attempts of each key, such as a username or the address of a network, and blocks a key that reached its limit within the window. */
export interface AttemptLimiter {
  readonly limit: AttemptLimit;
  /** Counts an attempt of the key and returns undefined, or returns the moment when the key may try again when it reached its limit. An attempt counts as a failure until takeBack takes it back, so attempts that run at the same time cannot pass the limit together. */
  startAttempt: (key: string, now: Date) => Date | undefined;
  /** Takes back the attempt that startAttempt counted at this moment, because it succeeded. */
  takeBack: (key: string, startedAt: Date) => void;
  /** Takes back every attempt of the key. */
  forget: (key: string) => void;
}

// The attempts stay in memory only. An address is personal data that Portolab has no reason to store, and a restart that forgets them gives an attacker only what one window allows.
export function createAttemptLimiter(limit: AttemptLimit): AttemptLimiter {
  const windowMilliseconds = limit.windowMinutes * 60_000;
  const attemptsByKey = new Map<string, Date[]>();

  function isRecent(attempt: Date, now: Date): boolean {
    return now.getTime() - attempt.getTime() < windowMilliseconds;
  }

  // Many keys try once and never return, such as usernames that someone guesses, so every new attempt drops the keys whose attempts all left the window.
  function forgetOldKeys(now: Date): void {
    for (const [key, attempts] of attemptsByKey) {
      if (!attempts.some((attempt) => isRecent(attempt, now))) {
        attemptsByKey.delete(key);
      }
    }
  }

  return {
    limit,
    startAttempt(key, now) {
      forgetOldKeys(now);
      const recent = (attemptsByKey.get(key) ?? []).filter((attempt) =>
        isRecent(attempt, now),
      );
      // The key may try again when the attempt that keeps it at the limit leaves the window.
      const blocking = recent.at(-limit.failures);
      if (recent.length >= limit.failures && blocking !== undefined) {
        return new Date(blocking.getTime() + windowMilliseconds);
      }
      attemptsByKey.set(key, [...recent, now]);
      return undefined;
    },
    takeBack(key, startedAt) {
      const attempts = attemptsByKey.get(key) ?? [];
      const index = attempts.findIndex(
        (attempt) => attempt.getTime() === startedAt.getTime(),
      );
      if (index !== -1) {
        attempts.splice(index, 1);
      }
    },
    forget(key) {
      attemptsByKey.delete(key);
    },
  };
}
