/** The limits on wrong passwords. A username has a low limit, which stops someone who guesses its password. A whole class often shares one address on a campus network, so the limit of an address lets every student of a class mistype a few times. Each window is also how long the limits keep a username or an address in memory after its last wrong password, as the privacy notice states. */
export const passwordLimits = {
  byUsername: { failures: 10, windowMinutes: 15 },
  byAddress: { failures: 100, windowMinutes: 15 },
} as const;

/** The days without a visit after which a session ends, at most an hour later because a session records a visit at most once an hour. A week passes between two meetings of a class, so a student who misses one meeting still finds the session. */
export const sessionInactivityDays = 14;
