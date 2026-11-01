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
  /** The number of keys that the limiter holds. @internal Only a test reads it, because the limiter drops a key on a timer, which no other behavior shows. */
  keyCount: () => number;
}

// The attempts stay in memory only. A username or an address is personal data that Portolab has no reason to store, and a restart that forgets them gives an attacker only what one window allows.
export function createAttemptLimiter(limit: AttemptLimit): AttemptLimiter {
  const windowMilliseconds = limit.windowMinutes * 60_000;
  const attemptsByKey = new Map<string, Date[]>();

  function recentAttempts(key: string, now: Date): Date[] {
    return (attemptsByKey.get(key) ?? []).filter(
      (attempt) => now.getTime() - attempt.getTime() < windowMilliseconds,
    );
  }

  function keep(key: string, attempts: Date[]): void {
    if (attempts.length === 0) {
      attemptsByKey.delete(key);
    } else {
      attemptsByKey.set(key, attempts);
    }
  }

  // The privacy notice promises that a key leaves memory when its last attempt leaves the window, so each attempt drops itself once its own window ends, even when the key never tries again. It drops itself by identity rather than by age, because the clock of a timer can run behind the clock of the dates.
  function dropWhenOld(key: string, attempt: Date): void {
    setTimeout(() => {
      keep(
        key,
        (attemptsByKey.get(key) ?? []).filter((kept) => kept !== attempt),
      );
    }, windowMilliseconds).unref();
  }

  return {
    limit,
    startAttempt(key, now) {
      const recent = recentAttempts(key, now);
      // The key may try again when the attempt that keeps it at the limit leaves the window.
      const blocking = recent.at(-limit.failures);
      if (recent.length >= limit.failures && blocking !== undefined) {
        return new Date(blocking.getTime() + windowMilliseconds);
      }
      // Each attempt is its own date, so that its timer drops this attempt alone, even when another attempt has the same time.
      const attempt = new Date(now);
      attemptsByKey.set(key, [...recent, attempt]);
      dropWhenOld(key, attempt);
      return undefined;
    },
    takeBack(key, startedAt) {
      const attempts = attemptsByKey.get(key) ?? [];
      const index = attempts.findIndex(
        (attempt) => attempt.getTime() === startedAt.getTime(),
      );
      if (index !== -1) {
        keep(key, attempts.toSpliced(index, 1));
      }
    },
    forget(key) {
      attemptsByKey.delete(key);
    },
    keyCount() {
      return attemptsByKey.size;
    },
  };
}
