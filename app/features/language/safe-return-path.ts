/** Returns the path to send the user back to, or the home page when the path could lead to another site. */
export function safeReturnPath(value: FormDataEntryValue | null): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/";
  }
  return value;
}
