import type { ReactNode } from "react";

export type IconName =
  | "map"
  | "trend"
  | "list"
  | "pie"
  | "cap"
  | "users"
  | "join"
  | "signIn"
  | "globe"
  | "chevronDown"
  | "chevronLeft"
  | "arrowRight"
  | "check"
  | "book"
  | "search"
  | "flask"
  | "eye"
  | "clock"
  | "briefcase";

// The prototype of decision 0028 draws these lines on a grid of 24 with round ends, so each icon takes the stroke of its text.
const paths: Record<IconName, string> = {
  briefcase: "M3 7h18v13H3ZM8 7V3h8v4M3 12h18M10 12v3h4v-3",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14",
  trend: "M3 17l6-6 4 4 8-8M14 7h7v7",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  pie: "M21 12A9 9 0 1 1 12 3v9h9Z",
  cap: "M22 10 12 5 2 10l10 5 10-5ZM6 12v5c3 2.5 9 2.5 12 0v-5",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  join: "M12 5v14M5 12h14",
  signIn: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  globe:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  chevronDown: "M6 9l6 6 6-6",
  chevronLeft: "M15 6l-6 6 6 6",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 3H20v19H6.5A2.5 2.5 0 0 1 4 19.5v-14A2.5 2.5 0 0 1 6.5 3Z",
  flask:
    "M9 3h6M10 3v7l-5 9a1.5 1.5 0 0 0 1.3 2h11.4a1.5 1.5 0 0 0 1.3-2l-5-9V3M8 15h8",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  search: "M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
};

/** An icon beside the text that names its part, so a screen reader skips it. The part that holds it sets its size. */
export function Icon({
  name,
  className,
}: {
  name: IconName;
  className: string | undefined;
}): ReactNode {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
