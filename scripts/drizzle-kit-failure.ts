/** How drizzle-kit ended, as the check sees it. */
interface DrizzleKitRun {
  /** The exit code, which is null when a signal ended the process. */
  status: number | null;
  stderr: string;
}

/** Returns a sentence when drizzle-kit failed, which means that it exited with another code than 0 or wrote to stderr. It exits with 0 after some errors, such as a question about a renamed column that it cannot ask without a terminal, so its stderr counts as well. */
export function drizzleKitFailure(run: DrizzleKitRun): string | undefined {
  if (run.status === 0 && run.stderr.trim() === "") {
    return undefined;
  }
  const exit =
    run.status === null
      ? "a signal ended it"
      : `it exited with code ${String(run.status)}`;
  return `drizzle-kit could not compare the schema with the migrations, and ${exit}. It reported: ${run.stderr.trim() === "" ? "nothing on stderr" : run.stderr.trim()}`;
}
