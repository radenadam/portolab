import { expect, test } from "vitest";
import { dayMilliseconds, secondMilliseconds } from "~/time-units";
import { readTheme, themeCookieHeader } from "./theme-cookie.server";
import { themeLifetimeDays, themes } from "./theme";

function requestWithCookie(cookie: string): Request {
  return new Request("http://portolab.test", { headers: { Cookie: cookie } });
}

test("keeps every theme in a browser cookie for its declared lifetime", async () => {
  for (const theme of themes) {
    const header = await themeCookieHeader(theme);
    expect(header).toContain("portolab_theme=");
    expect(header).toContain(
      `Max-Age=${String((themeLifetimeDays * dayMilliseconds) / secondMilliseconds)}`,
    );
    expect(header).toContain("Path=/");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
    expect(await readTheme(requestWithCookie(header))).toBe(theme);
  }
});

test("follows the device when the cookie is missing or malformed", async () => {
  for (const cookie of [
    "",
    "portolab_theme=broken",
    "portolab_theme=" + btoa(JSON.stringify("sepia")),
    "portolab_theme=" + btoa(JSON.stringify({ theme: "dark" })),
  ]) {
    expect(await readTheme(requestWithCookie(cookie))).toBe("system");
  }
});
