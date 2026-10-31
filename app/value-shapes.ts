/** Whether a value is an object with named fields, such as parsed JSON, so that its fields can be read. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Describes a value that a parser rejected, for the end of a failure text, such as "missing", "\"develop\"", or "a value of type File". */
export function describeValue(value: unknown): string {
  if (value === undefined) {
    return "missing";
  }
  // JSON shows a class instance, such as a file from a form, as {}, so such a value is named by its class.
  if (isRecord(value) && Object.getPrototypeOf(value) !== Object.prototype) {
    return `a value of type ${typeName(value)}`;
  }
  return JSON.stringify(value);
}

/** Names the type of a value, such as "number" for 7 or "File" for a file from a form. */
export function typeName(value: unknown): string {
  return isRecord(value) && Object.getPrototypeOf(value) !== Object.prototype
    ? value.constructor.name
    : typeof value;
}

export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
