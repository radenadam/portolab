/** The limits on wrong passwords. A username has a low limit, which stops someone who guesses its password. A whole class often shares one address on a campus network, so the limit of an address lets every student of a class mistype a few times. */
export const passwordLimits = {
  byUsername: { failures: 10, windowMinutes: 15 },
  byAddress: { failures: 100, windowMinutes: 15 },
} as const;

/** The days without a visit after which a session ends. A week passes between two meetings of a class, so a student who misses one meeting still finds the session. */
export const sessionInactivityDays = 14;
