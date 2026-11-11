import { wibDateOf } from "~/wib";
import { writeLog } from "~/write-log.server";

/** Returns a function that writes each warning that it receives to the log once on each date in WIB. So the job can hand it the warnings of every minute, and the log of each day still names the data that is missing on that day. */
export function dailyWarningLog(): (
  now: Date,
  warnings: readonly string[],
) => void {
  let loggedDate = "";
  const loggedWarnings = new Set<string>();
  return (now, warnings) => {
    const date = wibDateOf(now);
    if (date !== loggedDate) {
      loggedDate = date;
      loggedWarnings.clear();
    }
    for (const warning of warnings) {
      if (!loggedWarnings.has(warning)) {
        loggedWarnings.add(warning);
        writeLog("warning", warning);
      }
    }
  };
}
