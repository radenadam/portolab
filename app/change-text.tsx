import type { ReactNode } from "react";
import type { ChangeDirection, SignedChange } from "./formatting";

const arrows: Record<ChangeDirection, string | undefined> = {
  rise: "▲",
  fall: "▼",
  none: undefined,
};

/** The arrow and optional ink take the rounded direction, so neither can disagree with the number. */
export function ChangeText({
  change,
  colored = false,
}: {
  change: SignedChange;
  colored?: boolean;
}): ReactNode {
  const arrow = arrows[change.direction];
  const text = (
    <>
      {/* The arrow repeats the sign that the change shows for sighted readers, so screen readers skip it. The space belongs to the arrow, so a change without an arrow starts with its number. */}
      {arrow !== undefined && <span aria-hidden="true">{`${arrow} `}</span>}
      {change.text}
    </>
  );
  return colored ? <span data-change={change.direction}>{text}</span> : text;
}
