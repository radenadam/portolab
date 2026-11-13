import type { ReactNode } from "react";
import styles from "./app-icon.module.css";

/** A part of the app icon, which takes a color of its own. */
type IconPart = "flask" | "line";

// The shape is measured from docs/design/peta/app-icon.png on a grid of 48, and the view box crops it to the flask with its stroke.
const shape = {
  viewBox: "9 8.7 30 30",
  flask:
    "M18.2 10.7H29.8M19.9 10.7V18.7L12.36 31.14A3.665 3.665 0 0 0 15.5 36.7H32.5A3.665 3.665 0 0 0 35.64 31.14L28.1 18.7V10.7",
  line: "M16.45 32.23L20.62 28.17L24.79 31.32L29.57 27.04",
};
const stroke = { width: 2.4, cap: "round", join: "round" } as const;
const parts: readonly IconPart[] = ["flask", "line"];

// A browser draws the icon of a tab on its own ground, which follows the theme of the device, and no token of app/theme.css reaches it. So it holds the values of --color-ink and --color-gain of each theme, which e2e/theme.test.ts compares with the colors of the icon in the frame.
const tabIconColors: Record<"light" | "dark", Record<IconPart, string>> = {
  light: { flask: "#0f1820", line: "#0b7a53" },
  dark: { flask: "#e9eef2", line: "#3dcb8c" },
};

/** The app icon that decision 0028 describes, a flask with a rising line inside it, on no ground of its own. The flask takes the ink of the theme and the line takes the green of gains. A screen reader skips it, because it only adorns the name of Portolab. */
export function AppIcon(): ReactNode {
  return (
    <svg className={styles["icon"]} viewBox={shape.viewBox} aria-hidden="true">
      {parts.map((part) => (
        <path
          key={part}
          className={styles[part]}
          d={shape[part]}
          fill="none"
          strokeWidth={stroke.width}
          strokeLinecap={stroke.cap}
          strokeLinejoin={stroke.join}
        />
      ))}
    </svg>
  );
}

function tabIconPath(part: IconPart): string {
  return `<path class="${part}" d="${shape[part]}" fill="none" stroke-width="${String(stroke.width)}" stroke-linecap="${stroke.cap}" stroke-linejoin="${stroke.join}"/>`;
}

function tabIconStyle(colors: Record<IconPart, string>): string {
  return `.flask{stroke:${colors.flask}}.line{stroke:${colors.line}}`;
}

/** The address of the icon of a browser tab, the app icon as an SVG in the address itself, so a browser fetches nothing for it. */
export const tabIconAddress = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${shape.viewBox}"><style>${tabIconStyle(tabIconColors.light)}@media (prefers-color-scheme: dark){${tabIconStyle(tabIconColors.dark)}}</style>${parts.map(tabIconPath).join("")}</svg>`,
)}`;
