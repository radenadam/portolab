import type { ReactNode } from "react";
import styles from "./avatar.module.css";
import { initialsOf } from "./initials-of";

/** How an avatar is drawn: in the raised color, or in the tint of the reader's own point. */
export type AvatarLook = "plain" | "own";

/** The picture of a person, a circle with the initials of the name. The name of its button or the name beside it says whose it is, so the picture is drawn by its style and stays out of what a screen reader reads, as an image would. */
export function Avatar({
  name,
  look,
}: {
  name: string;
  look: AvatarLook;
}): ReactNode {
  const classes: Record<AvatarLook, string | undefined> = {
    plain: styles["avatar"],
    own: styles["own"],
  };
  return (
    <span
      className={classes[look]}
      data-initials={initialsOf(name)}
      aria-hidden="true"
    />
  );
}
