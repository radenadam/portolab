import { createCookie } from "react-router";
import { dayMilliseconds, secondMilliseconds } from "~/time-units";
import { parseTheme } from "./parse-theme";
import { defaultTheme, themeCookieName, themeLifetimeDays } from "./theme";
import type { Theme } from "./theme";

const themeCookie = createCookie(themeCookieName, {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: (themeLifetimeDays * dayMilliseconds) / secondMilliseconds,
});

export async function readTheme(request: Request): Promise<Theme> {
  const value: unknown = await themeCookie.parse(request.headers.get("Cookie"));
  const theme = parseTheme(value, `The cookie ${themeCookie.name}`);
  return theme.ok ? theme.value : defaultTheme;
}

export function themeCookieHeader(theme: Theme): Promise<string> {
  return themeCookie.serialize(theme);
}
