import type { ReactNode } from "react";
import styles from "./avatar.module.css";
import { initialsOf } from "./initials-of";

/** How an avatar is drawn: in the raised color, or in the tint of the reader's own point. */
export type AvatarLook = "plain" | "own";

/** The picture of a person, a circle with the initials of the name. The name of its button or the name beside it says whose it is, so the picture is drawn by its style and stays out of what a screen reader reads, as an image would. A class of the caller sets what only its screen needs, such as a larger size or a place in a grid. */
export function Avatar({
  name,
  look,
  className,
}: {
  name: string;
  look: AvatarLook;
  className?: string | undefined;
}): ReactNode {
  const classes: Record<AvatarLook, string | undefined> = {
    plain: styles["avatar"],
    own: styles["own"],
  };
  // The frame loads this module on every page before the styles of a route, so the class of the caller comes later in the cascade and wins over the look.
  return (
    <span
      className={[classes[look], className].join(" ").trim()}
      data-initials={initialsOf(name)}
      aria-hidden="true"
    />
  );
}
