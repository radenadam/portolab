import { request as sendRequest } from "node:http";
import type { IncomingHttpHeaders } from "node:http";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  nameMaximumLength,
  passwordLength,
} from "../app/features/accounts/account-limits.ts";
import {
  fieldMaximumLength,
  formMaximumBytes,
  statedSizeMaximumDigits,
} from "../app/form-size.ts";
import { languageNames } from "../app/language-names.ts";
import { secondMilliseconds } from "../app/time-units.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import {
  runAccountCommand,
  signInAsNewLecturer,
  submitAccountForm,
  submitSignIn,
  uniqueUsername,
} from "./accounts.ts";
import { chooseLanguage } from "./choose-language.ts";
import { createTestClass } from "./create-test-class.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { newDevice } from "./new-device.ts";
import { baseUrl } from "./test-server.ts";
import { wideWord } from "./wide-word.ts";

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
    tooLargeBodies: Record<PastedText | "widestStatedSize", string>;
    openFormLink: string;
    widestFieldErrors: Record<WidestField, string>;
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
      widestStatedSize:
        "Formulir ini berukuran 999.999.999.999.999 byte, tetapi Portolab menerima formulir paling besar 128.000 byte. Hal ini terjadi jika teks yang sangat panjang ditempel ke sebuah kolom. Buka formulirnya lagi, lalu isi setiap kolom dengan teks yang lebih pendek.",
    },
    openFormLink: "Buka formulirnya lagi",
    widestFieldErrors: {
      username:
        'Kolom "Nama pengguna" berisi 100.000 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
      code: 'Kolom "Kode kelas" berisi 100.000 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
      personName:
        'Kolom "Nama Anda" berisi 100.000 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
      currentPassword:
        'Kolom "Kata sandi saat ini" berisi 100.000 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
      className:
        'Kolom "Nama kelas" berisi 100.000 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
    },
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
      widestStatedSize:
        "This form has 999,999,999,999,999 bytes, but Portolab accepts a form of at most 128,000 bytes. This happens when a very long text is pasted into a field. Open the form again and fill in each field with a shorter text.",
    },
    openFormLink: "Open the form again",
    widestFieldErrors: {
      username:
        'The field "Username" has 100,000 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
      code: 'The field "Code of the class" has 100,000 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
      personName:
        'The field "Your name" has 100,000 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
      currentPassword:
        'The field "Current password" has 100,000 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
      className:
        'The field "Name of the class" has 100,000 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
    },
  },
};

const signInPath = "/sign-in?returnTo=%2Fclasses";

/** The fields whose error of the maximum of any field the tests show, one on each form that a person fills in. */
type WidestField =
  "username" | "code" | "personName" | "currentPassword" | "className";

// The smallest number with as many digits as the limit of a form, so a field of this length still fits in a form, and its error shows the length at its widest.
const widestFieldLength = 10 ** (String(formMaximumBytes).length - 1);

/** Fills a field of the form in the main part of the page far past the maximum of any field, at the widest length that a form holds, sends the form, and checks the error at the field on a screen that passes the checks of accessibility. */
async function expectWidestFieldError(
  page: Page,
  fieldName: string,
  error: string,
): Promise<void> {
  const fieldSelector = `input[name="${fieldName}"]`;
  const form = page
    .locator("main form")
    .filter({ has: page.locator(fieldSelector) });
  await form.locator(fieldSelector).fill(wideWord("W", widestFieldLength));
  await form.locator("button[type=submit]").click();
  await expect(page.getByText(error, { exact: true })).toBeVisible();
  await expectAccessibleScreen(page);
}

const forgedRequestTimeoutSeconds = 10;

/** Sends a form as a forged request that states a size of statedSizeMaximumDigits digits, the widest that the limit reads, without a body of that size, and returns the answer of the server, which refuses the form before it reads the body. */
function sendWithWidestStatedSize(
  url: string,
  headers: Record<string, string>,
): Promise<{ status: number; headers: Record<string, string>; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const forged = sendRequest(
      url,
      {
        method: "POST",
        headers: {
          ...headers,
          "content-length": "9".repeat(statedSizeMaximumDigits),
        },
        agent: false,
        timeout: forgedRequestTimeoutSeconds * secondMilliseconds,
      },
      (answer) => {
        const pieces: Buffer[] = [];
        answer.on("data", (piece: Buffer) => {
          pieces.push(piece);
        });
        answer.on("end", () => {
          // The server still waits for the body that the request stated, so the test closes the connection.
          forged.destroy();
          resolve({
            status: answer.statusCode ?? 0,
            headers: answerHeaders(answer.headers),
            body: Buffer.concat(pieces),
          });
        });
      },
    );
    forged.on("timeout", () => {
      forged.destroy(
        new Error(
          `The server did not answer the forged form within ${String(forgedRequestTimeoutSeconds)} seconds.`,
        ),
      );
    });
    forged.on("error", reject);
    forged.flushHeaders();
  });
}

/** The headers of an answer that the browser reads, such as the one that marks the data of React Router, without those of the connection, which the browser sets for the answer that the test gives it. */
function answerHeaders(headers: IncomingHttpHeaders): Record<string, string> {
  const connectionHeaders = [
    "connection",
    "keep-alive",
    "transfer-encoding",
    "content-length",
  ];
  const kept: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value !== undefined && !connectionHeaders.includes(name)) {
      kept[name] = Array.isArray(value) ? value.join(", ") : value;
    }
  }
  return kept;
}

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

  test(`shows the widest size that the limit reads on the page of a form that is too large, in ${language}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    // A browser states the true size of its form, and so does the client of Playwright, so the test sends the form itself with the widest size that the limit reads, as a forged request can.
    await page.route("**/sign-in*", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await route.fulfill(
        await sendWithWidestStatedSize(
          route.request().url(),
          route.request().headers(),
        ),
      );
    });
    await page.goto(signInPath);
    await page
      .getByLabel(text.passwordLabel, { exact: true })
      .fill("a wrong password");
    await page
      .getByRole("main")
      .getByRole("button", { name: text.signInButton })
      .click();
    await expect(
      page.getByText(text.tooLargeBodies.widestStatedSize),
    ).toBeVisible();
    await expectAccessibleScreen(page);
  });

  test(`shows the error of the maximum of any field at its widest on each form of a visitor, in ${language}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, "Dosen Uji");
    const testClass = await createTestClass(page, "Manajemen Portofolio A");
    const visitor = await newDevice(browser, locale);
    await visitor.goto("/sign-in");
    await expectWidestFieldError(
      visitor,
      "username",
      text.widestFieldErrors.username,
    );
    await visitor.goto("/join");
    await expectWidestFieldError(visitor, "code", text.widestFieldErrors.code);
    await visitor.goto(testClass.joinPath);
    await expectWidestFieldError(
      visitor,
      "name",
      text.widestFieldErrors.personName,
    );
    await visitor.context().close();
  });

  test(`shows the error of the maximum of any field at its widest on each form of a lecturer, in ${language}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    const username = uniqueUsername("dosen");
    const temporaryPassword = runAccountCommand("create-lecturer", username);
    await page.goto("/sign-in");
    await submitSignIn(page, username, temporaryPassword);
    await expect(page).toHaveURL(/^[^?]*\/account\/setup/);
    await expectWidestFieldError(
      page,
      "name",
      text.widestFieldErrors.personName,
    );
    await submitAccountForm(page, { name: "Dosen Uji" });
    await expect(page).toHaveURL("/classes");
    await page.goto("/account");
    await expectWidestFieldError(
      page,
      "currentPassword",
      text.widestFieldErrors.currentPassword,
    );
    await page.goto("/classes");
    await expectWidestFieldError(
      page,
      "name",
      text.widestFieldErrors.className,
    );
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
