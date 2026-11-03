/** One word of a length, which starts with a prefix that tells it apart and goes on in the widest letter, so that a screen shows it at its widest without a place to break the line. */
export function wideWord(prefix: string, length: number): string {
  return `${prefix}${"W".repeat(length - prefix.length)}`;
}
