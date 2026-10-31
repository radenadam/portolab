/** Writes one reason to stderr. In GitHub Actions, the reason becomes an error annotation on the run. */
export function writeScriptFailure(reason: string): void {
  const prefix = process.env["GITHUB_ACTIONS"] === "true" ? "::error::" : "";
  process.stderr.write(`${prefix}${reason}\n`);
}
