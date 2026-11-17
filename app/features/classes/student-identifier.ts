/** A membership without a NIM still needs an identifier beside a name shared by other students. */
export function studentIdentifier(student: {
  nim: string | null;
  username: string;
}): string {
  return student.nim ?? student.username;
}
