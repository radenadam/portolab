import { m } from "~/paraglide/messages.js";
import type { Role } from "./accounts.schema";

const roleNames: Record<Role, () => string> = {
  lecturer: m.accounts_lecturer_role_name,
  student: m.accounts_student_role_name,
};

/** The name of a role in the active language, such as Dosen. */
export function roleName(role: Role): string {
  return roleNames[role]();
}
