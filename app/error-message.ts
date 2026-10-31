/** Returns the message of a caught error, which JavaScript does not guarantee to be an Error. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
