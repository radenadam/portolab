import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  nameMaximumLength,
  passwordLength,
} from "../app/features/accounts/account-limits.ts";
import { fieldMaximumLength, formMaximumBytes } from "../app/form-size.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { runAccountCommand, submitSignIn, uniqueUsername } from "./accounts.ts";
import { chooseLanguage } from "./choose-language.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { baseUrl } from "./test-server.ts";

// A text of one byte more than the limit, and a text far larger than the buffers of a connection hold, which the browser can send in full only when the server reads all of it.
const pastedTexts = {
  justPastLimit: "a".repeat(formMaximumBytes + 1),
  farPastLimit: "a".repeat(2_000_000),
} as const;

type PastedText = keyof typeof pastedTexts;

// The sign-in form sends its other fields in 39 bytes, so the stated sizes are 128,040 and 2,000,039 bytes.
const texts: Record<
  Locale,
  {
    signInTitle: string;
    passwordLabel: string;
    signInButton: string;
    tooLargeTitle: string;
    tooLargeBodies: Record<PastedText, string>;
    openFormLink: string;
  }
> = {
  id: {
    signInTitle: "Masuk",
    passwordLabel: "Kata sandi",
    signInButton: "Masuk",
    tooLargeTitle: "Formulir terlalu besar",
    tooLargeBodies: {
      justPastLimit:
        "Formulir ini berukuran 128.040 byte, tetapi Portolab menerima formulir paling besar 128.000 byte. Hal ini terjadi jika teks yang sangat panjang ditempel ke sebuah kolom. Buka formulirnya lagi, lalu isi setiap kolom dengan teks yang lebih pendek.",
      farPastLimit:
        "Formulir ini berukuran 2.000.039 byte, tetapi Portolab menerima formulir paling besar 128.000 byte. Hal ini terjadi jika teks yang sangat panjang ditempel ke sebuah kolom. Buka formulirnya lagi, lalu isi setiap kolom dengan teks yang lebih pendek.",
    },
    openFormLink: "Buka formulirnya lagi",
  },
  en: {
    signInTitle: "Sign in",
    passwordLabel: "Password",
    signInButton: "Sign in",
    tooLargeTitle: "The form is too large",
    tooLargeBodies: {
      justPastLimit:
        "This form has 128,040 bytes, but Portolab accepts a form of at most 128,000 bytes. This happens when a very long text is pasted into a field. Open the form again and fill in each field with a shorter text.",
      farPastLimit:
        "This form has 2,000,039 bytes, but Portolab accepts a form of at most 128,000 bytes. This happens when a very long text is pasted into a field. Open the form again and fill in each field with a shorter text.",
    },
    openFormLink: "Open the form again",
  },
};

const signInPath = "/sign-in?returnTo=%2Fclasses";

/** Pastes a text into the password of the sign-in form, sends the form, and checks that the page explains the refusal with the size of the form and the status of a body too large. */
async function sendTooLargeSignIn(
  page: Page,
  locale: Locale,
  pasted: PastedText,
): Promise<void> {
  const text = texts[locale];
  await page.goto(signInPath);
  await page
    .getByLabel(text.passwordLabel, { exact: true })
    .fill(pastedTexts[pasted]);
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
  await expect(page.getByText(text.tooLargeBodies[pasted])).toBeVisible();
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`refuses a form larger than the limit, explains why with its size, and opens the form again, in ${language}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await sendTooLargeSignIn(page, locale, "justPastLimit");
    await expectAccessibleScreen(page);
    await page.getByRole("link", { name: text.openFormLink }).click();
    await expect(page).toHaveURL(signInPath);
    await expect(
      page.getByRole("heading", { level: 1, name: text.signInTitle }),
    ).toBeVisible();
    await sendTooLargeSignIn(page, locale, "farPastLimit");
  });

  test.describe(`before JavaScript loads in ${language}`, () => {
    // Axe runs in the page, so the screen is checked in the test with JavaScript, and this test checks that the refusal works without it.
    test.use({ javaScriptEnabled: false });

    test("refuses a form larger than the limit and explains why with its size", async ({
      page,
    }) => {
      await chooseLanguage(page, locale);
      await sendTooLargeSignIn(page, locale, "justPastLimit");
      await sendTooLargeSignIn(page, locale, "farPastLimit");
    });
  });
}

test("answers a program that sends a body larger than the limit with the status of a body too large", async ({
  request,
}) => {
  const response = await request.post("/sign-in", {
    headers: { origin: baseUrl },
    form: { username: "dosen", password: pastedTexts.justPastLimit },
  });
  expect(response.status()).toBe(413);
});

test("lets the largest form of Portolab reach its action, with every field at its longest in the characters that take the most bytes", async ({
  page,
}) => {
  const username = uniqueUsername("dosen");
  const temporaryPassword = runAccountCommand("create-lecturer", username);
  await page.goto("/sign-in");
  await submitSignIn(page, username, temporaryPassword);
  await expect(page).toHaveURL(/^[^?]*\/account\/setup/);
  // The form that finishes an account holds the most text of any form: the path to return to, a name, and a new password twice. A form sends each byte of a character outside the basic plane of Unicode as an escape of three bytes, so these characters take the most bytes.
  const widestCharacter = "\u{1D49C}";
  const otherWidestCharacter = "\u{1D4B7}";
  const form = page.locator("main form");
  await form.locator('input[name="returnTo"]').evaluate(
    (input, path) => {
      input.setAttribute("value", path);
    },
    `/${widestCharacter.repeat(fieldMaximumLength - 1)}`,
  );
  await form
    .locator('input[name="name"]')
    .fill(widestCharacter.repeat(nameMaximumLength));
  await form
    .locator('input[name="newPassword"]')
    .fill(widestCharacter.repeat(passwordLength.maximum));
  // The repetition differs in its last character, so the action refuses the form at that field instead of finishing the account, which shows that the action read the whole form.
  await form
    .locator('input[name="repeatedPassword"]')
    .fill(
      `${widestCharacter.repeat(passwordLength.maximum - 1)}${otherWidestCharacter}`,
    );
  await form.locator('input[name="consent"]').check();
  const [response] = await Promise.all([
    page.waitForResponse((answer) => answer.request().method() === "POST"),
    form.locator("button[type=submit]").click(),
  ]);
  expect(response.status()).toBe(400);
});
