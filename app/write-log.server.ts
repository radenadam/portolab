type LogLevel = "info" | "warning" | "error";

// Warnings and errors go to stderr, so a process manager can keep them apart from ordinary events.
const streams: Record<LogLevel, NodeJS.WriteStream> = {
  info: process.stdout,
  warning: process.stderr,
  error: process.stderr,
};

/** Writes one JSON line per event, so that the server's logs can be searched and parsed. */
export function writeLog(
  level: LogLevel,
  message: string,
  details: Record<string, unknown> = {},
): void {
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    message,
    ...details,
  });
  streams[level].write(`${line}\n`);
}
