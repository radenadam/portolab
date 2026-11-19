import type { AvatarLook } from "~/avatar";
import type { Role } from "./accounts.schema";

// The prototype of decision 0028 draws the avatar of a student in the tint of the reader's own point, which marks the portfolio of the student on every map.
const avatarLooks: Record<Role, AvatarLook> = {
  student: "own",
  lecturer: "plain",
};

/** How the avatar of the person who is signed in is drawn in the menu of the profile and in the name that opens it on a desktop. */
export function profileAvatarLook(role: Role): AvatarLook {
  return avatarLooks[role];
}
