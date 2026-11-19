import type { UserId } from "~/features/accounts/accounts.schema";

// A name stays opaque when the view keeps formatted quantities together.
const studentNameBoundary = "\u0000";

export function studentNamePlaceholder(studentId: UserId): string {
  return `${studentNameBoundary}${String(studentId)}${studentNameBoundary}`;
}
