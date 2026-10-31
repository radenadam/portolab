// Decision 0001 asks the job to back off when Yahoo fails, and half an hour still updates the prices several times in a session.
const longestDelayMinutes = 30;

/** The minutes to wait before the next attempt after this many failures in a row: 1, 2, 4, 8, 16, and then 30. */
export function retryDelayMinutes(consecutiveFailures: number): number {
  return Math.min(2 ** (consecutiveFailures - 1), longestDelayMinutes);
}
