/** Writes each reason to stderr and exits with a failure. In GitHub Actions, each reason becomes an error annotation on the run. */
export function exitWithFailure(reasons: readonly string[]): never {
  const prefix = process.env["GITHUB_ACTIONS"] === "true" ? "::error::" : "";
  for (const reason of reasons) {
    process.stderr.write(`${prefix}${reason}\n`);
  }
  process.exit(1);
}
