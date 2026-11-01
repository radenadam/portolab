/** Puts a password in the one normal form in which Portolab counts and hashes it. The same text can arrive as different code points, such as an accented letter typed on a phone or on a computer. */
export function normalizePassword(password: string): string {
  return password.normalize("NFKC");
}
