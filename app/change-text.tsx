import type { ReactNode } from "react";
import type { ChangeDirection, SignedChange } from "./formatting";

const arrows: Record<ChangeDirection, string | undefined> = {
  rise: "▲",
  fall: "▼",
  none: undefined,
};

/** A change as formatSignedPercent or formatSignedRupiah gives it, after the arrow of its direction, in the color of the text, as decision 0012 sets. */
export function ChangeText({ change }: { change: SignedChange }): ReactNode {
  const arrow = arrows[change.direction];
  return (
    <>
      {/* The arrow repeats the sign that the change shows for sighted readers, so screen readers skip it. The space belongs to the arrow, so a change without an arrow starts with its number. */}
      {arrow !== undefined && <span aria-hidden="true">{`${arrow} `}</span>}
      {change.text}
    </>
  );
}
