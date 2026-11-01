// WIB keeps one offset from UTC all year, because Indonesia has no daylight saving time, and IDX publishes every time in WIB.
export const wibOffsetHours = 7;

/** WIB as a time zone for Intl, whose names of fixed zones count the hours west of UTC, so a zone east of UTC takes a minus sign. */
export const wibTimeZone = `Etc/GMT-${String(wibOffsetHours)}`;
