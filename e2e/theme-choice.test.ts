import { expect, test } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";
import { formMaximumBytes } from "../app/form-size.ts";
import { captureScreens } from "./capture-screens.ts";
import { routeFormFromAnotherSite } from "./route-form-from-another-site.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import type { Theme } from "../app/features/theme/theme.ts";
import { chooseLanguage } from "./choose-language.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { openProfileMenu } from "./frame.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { screenshotFullHeight } from "./screenshot-full-height.ts";
import { studentOnNewClass } from "./student-on-new-class.ts";
import { tokenColor } from "./token-color.ts";

type EarlyFailure = "origin" | "body";
type ExplicitTheme = Exclude<Theme, "system">;
const oppositeTheme: Record<ExplicitTheme, ExplicitTheme> = {
  light: "dark",
  dark: "light",
};
const earlyFailures: Record<EarlyFailure, { path: string; status: number }> = {
  origin: { path: "/theme", status: 403 },
  body: { path: "/sign-in", status: 413 },
};

const texts: Record<
  Locale,
  {
    label: string;
    choices: Record<Theme, string>;
    title: string;
    rejected: string;
    unknown: readonly [string, string];
    earlyFailures: Record<EarlyFailure, string>;
  }
> = {
  id: {
    label: "Tema",
    earlyFailures: {
      origin: "Portolab menolak formulir",
      body: "Formulir terlalu besar",
    },
    choices: { system: "Sistem", light: "Terang", dark: "Gelap" },
    title: "Pilih tema",
    rejected: "Tema tidak dapat diganti",
    unknown: [
      'Formulir mengirim "',
      '" di kolom "Tema", tetapi kolom ini hanya menerima Sistem, Terang, atau Gelap. Pilih salah satunya di pilihan tema.',
    ],
  },
  en: {
    label: "Theme",
    earlyFailures: {
      origin: "Portolab refused the form",
      body: "The form is too large",
    },
    choices: { system: "System", light: "Light", dark: "Dark" },
    title: "Choose a theme",
    rejected: "The theme could not be changed",
    unknown: [
      'The form sent "',
      '" in the field "Theme", but this field only takes System, Light, or Dark. Choose one of them in the theme choice.',
    ],
  },
};

async function themeTokens(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const tokens: Record<string, string> = {};
    const probe = document.createElement("div");
    document.body.append(probe);
    for (const name of root) {
      if (!name.startsWith("--")) continue;
      tokens[name] = root.getPropertyValue(name);
      if (name.startsWith("--color-")) {
        probe.style.color = `var(${name})`;
        tokens[`${name} resolved`] = getComputedStyle(probe).color;
      }
    }
    probe.style.boxShadow = "var(--shadow-popover)";
    tokens["shadow resolved"] = getComputedStyle(probe).boxShadow;
    probe.remove();
    return tokens;
  });
}

async function expectServerTheme(page: Page, theme: Theme): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  const response = await page.reload();
  expect(response).not.toBeNull();
  expect(await response?.text()).toContain(`data-theme="${theme}"`);
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

async function captureProfile(
  page: Page,
  {
    locale,
    theme,
    role,
    testInfo,
  }: { locale: Locale; theme: Theme; role: string; testInfo: TestInfo },
): Promise<void> {
  if (theme === "system") return;
  const viewport = page.viewportSize();
  if (viewport === null) throw new Error("The theme capture needs a viewport.");
  for (const width of testInfo.project.name === "phone"
    ? [360]
    : [1440, 1920]) {
    await page.setViewportSize({ width, height: viewport.height });
    await screenshotFullHeight(page, {
      path: testInfo.outputPath(
        `profile-${role}-${locale}-${String(width)}-${theme}.png`,
      ),
    });
    await page.locator("[popover]:popover-open").screenshot({
      path: testInfo.outputPath(
        `profile-menu-${role}-${locale}-${String(width)}-${theme}.png`,
      ),
    });
  }
  await page.setViewportSize(viewport);
}

async function checkReaderThemes(
  page: Page,
  locale: Locale,
  {
    capture,
    role,
    testInfo,
  }: { capture: boolean; role: string; testInfo: TestInfo },
): Promise<void> {
  const text = texts[locale];
  const address = page.url();
  const expected: Record<"light" | "dark", Record<string, string>> = {
    light: {},
    dark: {},
  };
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
    expected[colorScheme] = await themeTokens(page);
  }
  expect(expected.light).not.toEqual(expected.dark);
  for (const theme of ["light", "dark", "system"] as const) {
    const colorScheme = theme === "light" ? "dark" : "light";
    await page.emulateMedia({ colorScheme });
    const menu = await openProfileMenu(page);
    const group = menu.getByRole("group", { name: text.label });
    await expect(group.getByRole("button")).toHaveText(
      Object.values(text.choices),
    );
    await group
      .getByRole("button", { name: text.choices[theme], exact: true })
      .click();
    await expect(page).toHaveURL(address);
    await expectServerTheme(page, theme);
    expect(await themeTokens(page)).toEqual(
      expected[theme === "system" ? colorScheme : theme],
    );
    const reopened = await openProfileMenu(page);
    await expect(
      reopened.getByRole("button", { name: text.choices[theme], exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    if (capture) await captureProfile(page, { locale, theme, role, testInfo });
    await page.keyboard.press("Escape");
  }
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await themeTokens(page)).toEqual(expected.dark);
  await page.goto("/account");
  await expectServerTheme(page, "system");
}

async function submitEarlyFailure(
  page: Page,
  kind: EarlyFailure,
  buttonName: string,
): Promise<void> {
  switch (kind) {
    case "origin":
      await page
        .getByRole("main")
        .getByRole("button", { name: buttonName, exact: true })
        .click();
      return;
    case "body":
      await page
        .locator('main input[name="username"]')
        .fill("a".repeat(formMaximumBytes + 1));
      await page.locator('main button[type="submit"]').click();
      return;
  }
}

for (const locale of locales) {
  const text = texts[locale];
  for (const kind of ["origin", "body"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`keeps ${theme} before and after hydration when ${kind} refuses a form before the root loader in ${languageNames[locale]}`, async ({
        page,
      }, testInfo) => {
        await chooseLanguage(page, locale);
        await page.goto("/theme");
        await page
          .getByRole("main")
          .getByRole("button", { name: text.choices[theme], exact: true })
          .click();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await page.emulateMedia({ colorScheme: oppositeTheme[theme] });
        if (kind === "origin") await routeFormFromAnotherSite(page, "**/theme");
        const failure = earlyFailures[kind];
        try {
          await holdClientScripts(
            page,
            { address: failure.path },
            async (loadClient) => {
              const response = page.waitForResponse(
                (answer) => answer.request().method() === "POST",
              );
              await submitEarlyFailure(
                page,
                kind,
                text.choices[oppositeTheme[theme]],
              );
              const answer = await response;
              expect(answer.status()).toBe(failure.status);
              expect(await answer.text()).toContain(`data-theme="${theme}"`);
              await expect(page.locator("html")).toHaveAttribute(
                "data-theme",
                theme,
              );
              await expect(
                page.getByRole("heading", {
                  level: 1,
                  name: text.earlyFailures[kind],
                  exact: true,
                }),
              ).toBeVisible();
              await loadClient();
              await expect(page.locator("html")).toHaveAttribute(
                "data-theme",
                theme,
              );
              await expectAccessibleScreen(page);
              await captureScreens(page, testInfo, {
                name: `theme-early-${kind}-${locale}-${theme}`,
                fullPage: true,
                fromTop: true,
              });
            },
          );
        } finally {
          if (kind === "origin") await page.unroute("**/theme");
        }
      });
    }
  }

  for (const javaScriptEnabled of [false, true]) {
    test.describe(`theme choice in ${languageNames[locale]} with JavaScript ${String(javaScriptEnabled)}`, () => {
      test.use({ javaScriptEnabled });
      test("keeps each choice from the profile menu for students and lecturers and paints every token in the chosen theme", async ({
        page,
        browser,
      }, testInfo) => {
        const { lecturer, testClass } = await studentOnNewClass(page, browser, {
          locale,
          className: "Tema",
          lecturerName: "Dosen",
          studentName: "Mahasiswa",
          lecturerJavaScriptEnabled: javaScriptEnabled,
        });
        try {
          for (const [reader, role] of [
            [page, "student"],
            [lecturer, "lecturer"],
          ] as const) {
            await reader.goto(`${testClass.path}/market?sort=price`);
            await checkReaderThemes(reader, locale, {
              capture: javaScriptEnabled,
              role,
              testInfo,
            });
          }
        } finally {
          await lecturer.context().close();
        }
      });
    });
  }

  test(`keeps the native theme choice when client scripts start in ${languageNames[locale]}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await holdClientScripts(page, { address: "/theme" }, async (loadClient) => {
      await page
        .getByRole("main")
        .getByRole("button", { name: text.choices.dark, exact: true })
        .click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await loadClient();
      await expect(
        page
          .getByRole("main")
          .getByRole("button", { name: text.choices.dark, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await page
        .getByRole("main")
        .getByRole("button", { name: text.choices.light, exact: true })
        .click();
      await expectServerTheme(page, "light");
    });
  });

  test(`rejects a forged theme at its choice and lets the reader choose again in ${languageNames[locale]}`, async ({
    page,
  }, testInfo) => {
    await chooseLanguage(page, locale);
    for (const value of ["sepia", " 123456 "]) {
      await page.goto("/theme");
      await expect(page).toHaveTitle(`${text.title} | Portolab`);
      const form = page.getByRole("main");
      await form
        .getByRole("button", { name: text.choices.light, exact: true })
        .evaluate((button, sent) => {
          button.setAttribute("value", sent);
        }, value);
      const rejected = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname === "/theme",
      );
      await form
        .getByRole("button", { name: text.choices.light, exact: true })
        .click();
      expect((await rejected).status()).toBe(400);
      await expect(page).toHaveTitle(`${text.rejected} | Portolab`);
      const failure = form.locator("p[id]");
      await expect(failure).toHaveText(
        text.unknown[0] + value.trim() + text.unknown[1],
      );
      await expect(failure).toHaveCSS(
        "color",
        await tokenColor(page, "--color-loss"),
      );
      await expect(failure).toHaveCSS("font-weight", "600");
      await expect(failure.locator("[data-text-value]")).toHaveText(
        value.trim(),
      );
      await expect(failure.locator("[data-number]")).toHaveCount(0);
      await expect(
        form.getByRole("group", { name: text.label }),
      ).toHaveAttribute(
        "aria-describedby",
        await failure.evaluate((element) => element.id),
      );
      expect(
        await failure.evaluate((element) =>
          element.nextElementSibling?.getAttribute("role"),
        ),
      ).toBe("group");
      await expectAccessibleScreen(page);
      if (value === "sepia") {
        await captureScreens(page, testInfo, {
          name: `theme-rejected-${locale}`,
          fullPage: true,
          fromTop: true,
        });
      }
      await form
        .getByRole("button", { name: text.choices.light, exact: true })
        .click();
      await expectServerTheme(page, "light");
    }
  });
}
