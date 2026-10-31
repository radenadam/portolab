/** Whether a value is an object with named fields, such as parsed JSON, so that its fields can be read. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Describes a value that a parser rejected, for the end of a failure text, such as "missing" or "\"develop\"". */
export function describeValue(value: unknown): string {
  return value === undefined ? "missing" : JSON.stringify(value);
}

export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
