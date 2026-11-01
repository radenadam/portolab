/** The temporary password that the account command printed, which stands alone on an indented line so that a person can copy it, or undefined when the output holds none. */
export function printedPasswordForTest(output: string): string | undefined {
  return /^ {2}(\S+)$/m.exec(output)?.[1];
}
