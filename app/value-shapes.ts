/** Whether a value is an object with named fields, such as parsed JSON, so that its fields can be read. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Describes a value that a parser rejected, for the end of a failure text, such as "missing", "empty", "\"develop\"", or "a value of type File". */
export function describeValue(value: unknown): string {
  if (value === undefined) {
    return "missing";
  }
  if (value === "") {
    return "empty";
  }
  // JSON shows a class instance, such as a file from a form, as {}, so such a value is named by its class.
  const name = className(value);
  return name === undefined ? JSON.stringify(value) : `a value of type ${name}`;
}

/** Names the type of a value, such as "number" for 7 or "File" for a file from a form. */
export function typeName(value: unknown): string {
  return className(value) ?? typeof value;
}

/** The name of the class of an object, or undefined for a plain object, an object without a prototype, and any value that is not an object. */
function className(value: unknown): string | undefined {
  if (!isRecord(value) || Object.getPrototypeOf(value) === Object.prototype) {
    return undefined;
  }
  // Reflect reads the constructor even when a prototype chain has none, which happens for an object made from another object without a prototype.
  const classFunction: unknown = Reflect.get(value, "constructor");
  return typeof classFunction === "function" && classFunction.name !== ""
    ? classFunction.name
    : undefined;
}

export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
