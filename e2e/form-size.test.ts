import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { formMaximumBytes } from "../app/form-size.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { chooseLanguage } from "./choose-language.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { baseUrl } from "./test-server.ts";

const texts: Record<
  Locale,
  {
    signInTitle: string;
    passwordLabel: string;
    signInButton: string;
    tooLargeTitle: string;
    tooLargeBody: string;
    openFormLink: string;
  }
> = {
  id: {
    signInTitle: "Masuk",
    passwordLabel: "Kata sandi",
    signInButton: "Masuk",
    tooLargeTitle: "Formulir terlalu besar",
    tooLargeBody:
      "Portolab menerima formulir paling besar 128 kB, tetapi formulir ini lebih besar. Hal ini terjadi jika teks yang sangat panjang ditempel ke sebuah kolom. Buka formulirnya lagi, lalu isi setiap kolom dengan teks yang lebih pendek.",
    openFormLink: "Buka formulirnya lagi",
  },
  en: {
    signInTitle: "Sign in",
    passwordLabel: "Password",
    signInButton: "Sign in",
    tooLargeTitle: "The form is too large",
    tooLargeBody:
      "Portolab accepts a form of at most 128 kB, but this form was larger. This happens when a very long text is pasted into a field. Open the form again and fill in each field with a shorter text.",
    openFormLink: "Open the form again",
  },
};

// A text of one byte more than the limit, so the form that holds it is larger than the limit whatever its other fields hold.
const pastedText = "a".repeat(formMaximumBytes + 1);

const signInPath = "/sign-in?returnTo=%2Fclasses";

/** Pastes a text larger than the limit into the password of the sign-in form, sends the form, and checks that the page explains the refusal with the status of a body too large. */
async function sendTooLargeSignIn(page: Page, locale: Locale): Promise<void> {
  const text = texts[locale];
  await page.goto(signInPath);
  await page.getByLabel(text.passwordLabel, { exact: true }).fill(pastedText);
  const [response] = await Promise.all([
    page.waitForResponse((answer) => answer.request().method() === "POST"),
    page
      .getByRole("main")
      .getByRole("button", { name: text.signInButton })
      .click(),
  ]);
  expect(response.status()).toBe(413);
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
  await expect(page).toHaveTitle(`${text.tooLargeTitle} | Portolab`);
  await expect(
    page.getByRole("heading", { level: 1, name: text.tooLargeTitle }),
  ).toBeVisible();
  await expect(page.getByText(text.tooLargeBody)).toBeVisible();
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`refuses a form larger than the limit, explains why, and opens the form again, in ${language}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await sendTooLargeSignIn(page, locale);
    await expectAccessibleScreen(page);
    await page.getByRole("link", { name: text.openFormLink }).click();
    await expect(page).toHaveURL(signInPath);
    await expect(
      page.getByRole("heading", { level: 1, name: text.signInTitle }),
    ).toBeVisible();
  });

  test.describe(`before JavaScript loads in ${language}`, () => {
    // Axe runs in the page, so the screen is checked in the test with JavaScript, and this test checks that the refusal works without it.
    test.use({ javaScriptEnabled: false });

    test("refuses a form larger than the limit and explains why", async ({
      page,
    }) => {
      await chooseLanguage(page, locale);
      await sendTooLargeSignIn(page, locale);
    });
  });
}

test("answers a program that sends a body larger than the limit with the status of a body too large", async ({
  request,
}) => {
  const response = await request.post("/sign-in", {
    headers: { origin: baseUrl },
    form: { username: "dosen", password: pastedText },
  });
  expect(response.status()).toBe(413);
});
