/** The milliseconds in a second, the unit of time of a JavaScript date. */
export const secondMilliseconds = 1000;

/** The milliseconds in a minute. */
export const minuteMilliseconds = 60 * secondMilliseconds;

/** The milliseconds in an hour. */
export const hourMilliseconds = 60 * minuteMilliseconds;

/** The milliseconds in a day of 24 hours, which every calendar date has in UTC. */
export const dayMilliseconds = 24 * hourMilliseconds;

/** The moment a number of minutes after another. */
export function minutesAfter(moment: Date, minutes: number): Date {
  return new Date(moment.getTime() + minutes * minuteMilliseconds);
}
