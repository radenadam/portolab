/** Writes every failure with the writer that the program uses for its log, and then exits with a failure. */
export function exitWithFailure(
  failures: readonly string[],
  writeFailure: (failure: string) => void,
): never {
  for (const failure of failures) {
    writeFailure(failure);
  }
  process.exit(1);
}
