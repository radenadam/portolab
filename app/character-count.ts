/** Counts the characters of a text as a reader counts them. A letter outside the basic plane of Unicode takes two units of a JavaScript string, but it is one character. */
export function characterCount(text: string): number {
  return Array.from(text).length;
}
