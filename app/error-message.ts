/** Returns the message of a caught error, which JavaScript does not guarantee to be an Error. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Returns the stack of a caught error for a log, or its text when it has no stack. */
export function errorDetail(error: unknown): string {
  return error instanceof Error
    ? (error.stack ?? error.message)
    : String(error);
}
