import { wibDateOf } from "~/wib";
import { writeLog } from "~/write-log.server";

/** Returns a function that writes the warnings that warningsOn gives for the date of a moment in WIB to the log, on the first call of each date. The warnings depend only on the date, so the job can call it every minute, and the log of each day still names the data that is missing on that day. */
export function dailyWarningLog(
  warningsOn: (date: string) => readonly string[],
): (now: Date) => void {
  let loggedDate: string | undefined;
  return (now) => {
    const date = wibDateOf(now);
    if (date === loggedDate) {
      return;
    }
    loggedDate = date;
    for (const warning of warningsOn(date)) {
      writeLog("warning", warning);
    }
  };
}
