type LogLevel = "info" | "warning" | "error";

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
  const stream = level === "info" ? process.stdout : process.stderr;
  stream.write(`${line}\n`);
}
