import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import {
  chosenPassword,
  runAccountCommand,
  signInAsNewLecturer,
  submitSignIn,
  uniqueUsername,
} from "./accounts.ts";
import { chooseLanguage } from "./choose-language.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";

// The longest name that a test gives, so each screen that shows a name is checked with wide content.
const longName = "Kusumawardhani Prameswari Wicaksono Hadiningrat Setyaningrum";

const texts: Record<
  Locale,
  {
    signInLink: string;
    accountLink: string;
    signInTitle: string;
    usernameLabel: string;
    passwordLabel: string;
    signInButton: string;
    forgotNotice: string;
    wrongCredentials: string;
    emptyFields: readonly [string, string];
    blocked: readonly [string, string, string];
    firstSetupTitle: string;
    firstSetupBody: string;
    newPasswordTitle: string;
    newPasswordBody: string;
    nameLabel: string;
    lecturerNameHint: string;
    newPasswordLabel: string;
    passwordHint: string;
    repeatedPasswordLabel: string;
    tooShort: string;
    passwordsDiffer: string;
    privacyStoredTitle: string;
    consentLabel: string;
    consentMissing: string;
    finishButton: string;
    accountTitle: string;
    roleLabel: string;
    lecturerRole: string;
    consented: readonly [string, string];
    privacyLink: string;
    changePasswordTitle: string;
    currentPasswordLabel: string;
    changePasswordButton: string;
    passwordChanged: string;
    wrongCurrentPassword: string;
    signOutButton: string;
    signOutTitle: string;
    signOutBody: string;
    refusedTitle: string;
    refusedBody: string;
  }
> = {
  id: {
    signInLink: "Masuk",
    accountLink: "Akun Anda",
    signInTitle: "Masuk",
    usernameLabel: "Nama pengguna",
    passwordLabel: "Kata sandi",
    signInButton: "Masuk",
    forgotNotice:
      "Lupa kata sandi? Minta orang yang menjalankan server Portolab ini untuk mengatur ulang kata sandi Anda.",
    emptyFields: [
      'Kolom "Nama pengguna" kosong, padahal Portolab memerlukannya. Isi kolom itu.',
      'Kolom "Kata sandi" kosong, padahal Portolab memerlukannya. Isi kolom itu.',
    ],
    wrongCredentials:
      "Portolab tidak menemukan akun dengan nama pengguna dan kata sandi ini. Periksa keduanya, lalu coba lagi. Setelah 10 percobaan salah dalam 15 menit, Portolab memblokir nama pengguna itu untuk sementara, agar tidak ada yang dapat menebak kata sandinya.",
    blocked: [
      'Portolab memblokir kata sandi untuk "',
      '" sampai ',
      " WIB, karena menerima 10 kata sandi salah untuknya dalam 15 menit. Blokir ini menghentikan siapa pun yang mencoba menebak kata sandinya. Coba lagi setelah waktu tersebut.",
    ],
    firstSetupTitle: "Lengkapi akun Anda",
    firstSetupBody:
      "Selamat datang di Portolab. Isi nama Anda, pilih kata sandi Anda sendiri, dan setujui pemberitahuan privasi untuk melengkapi akun Anda.",
    newPasswordTitle: "Pilih kata sandi baru",
    newPasswordBody:
      "Anda masuk dengan kata sandi sementara. Pilih kata sandi Anda sendiri untuk melanjutkan.",
    nameLabel: "Nama Anda",
    lecturerNameHint:
      "Mahasiswa Anda melihat nama ini di setiap kelas yang Anda ajar.",
    newPasswordLabel: "Kata sandi baru",
    passwordHint:
      "Paling sedikit 15 karakter. Kalimat pendek yang hanya Anda ketahui cukup panjang dan mudah diingat.",
    repeatedPasswordLabel: "Ulangi kata sandi baru",
    tooShort:
      'Kolom "Kata sandi baru" perlu paling sedikit 15 karakter, tetapi isinya 5 karakter. Setiap karakter tambahan membuat kata sandi jauh lebih sulit ditebak, jadi pilih yang lebih panjang, misalnya kalimat pendek.',
    passwordsDiffer:
      'Isi kolom "Ulangi kata sandi baru" berbeda dari kata sandi baru. Ketik kata sandi yang sama di kedua kolom.',
    privacyStoredTitle: "Apa yang disimpan Portolab",
    consentLabel: "Saya menyetujui pemberitahuan privasi",
    consentMissing:
      'Portolab hanya menyimpan data Anda dengan persetujuan Anda. Baca pemberitahuan privasi, lalu centang "Saya menyetujui pemberitahuan privasi".',
    finishButton: "Simpan dan lanjutkan",
    accountTitle: "Akun Anda",
    roleLabel: "Peran",
    lecturerRole: "Dosen",
    consented: ["Anda menyetujui pemberitahuan privasi pada ", " WIB."],
    privacyLink: "Baca pemberitahuan privasi",
    changePasswordTitle: "Ubah kata sandi Anda",
    currentPasswordLabel: "Kata sandi saat ini",
    changePasswordButton: "Ubah kata sandi",
    passwordChanged:
      "Portolab menyimpan kata sandi baru Anda dan mengeluarkan Anda dari semua perangkat lain.",
    wrongCurrentPassword:
      'Kata sandi di kolom "Kata sandi saat ini" salah. Ketik lagi. Setelah 10 percobaan salah dalam 15 menit, Portolab memblokir nama pengguna Anda untuk sementara, agar tidak ada yang dapat menebak kata sandinya.',
    signOutButton: "Keluar",
    signOutTitle: "Keluar",
    signOutBody: "Keluar dari Portolab di perangkat ini.",
    refusedTitle: "Portolab menolak formulir",
    refusedBody:
      "Formulir ini datang dari situs lain, atau peramban tidak menyebutkan asalnya. Portolab menolak formulir seperti itu, agar tidak ada situs lain yang dapat bertindak atas nama Anda. Buka Portolab secara langsung, lalu kirim formulirnya lagi.",
  },
  en: {
    signInLink: "Sign in",
    accountLink: "Your account",
    signInTitle: "Sign in",
    usernameLabel: "Username",
    passwordLabel: "Password",
    signInButton: "Sign in",
    forgotNotice:
      "Forgot your password? Ask the person who runs this Portolab server to reset it.",
    emptyFields: [
      'The field "Username" is empty, but Portolab needs it. Fill it in.',
      'The field "Password" is empty, but Portolab needs it. Fill it in.',
    ],
    wrongCredentials:
      "Portolab found no account with this username and password. Check both and try again. After 10 wrong attempts within 15 minutes, Portolab blocks the username for a while, so that nobody can guess its password.",
    blocked: [
      'Portolab blocks passwords for "',
      '" until ',
      " WIB, because it received 10 wrong passwords for it within 15 minutes. The block stops anyone who tries to guess the password. Try again after that time.",
    ],
    firstSetupTitle: "Finish your account",
    firstSetupBody:
      "Welcome to Portolab. Give your name, choose your own password, and agree to the privacy notice to finish your account.",
    newPasswordTitle: "Choose a new password",
    newPasswordBody:
      "You signed in with a temporary password. Choose your own password to continue.",
    nameLabel: "Your name",
    lecturerNameHint:
      "Your students see this name on each class that you teach.",
    newPasswordLabel: "New password",
    passwordHint:
      "At least 15 characters. A short sentence that only you know is long enough and easy to remember.",
    repeatedPasswordLabel: "New password again",
    tooShort:
      'The field "New password" needs at least 15 characters, but it has 5. Each extra character makes a password much harder to guess, so choose a longer one, such as a short sentence.',
    passwordsDiffer:
      'The field "New password again" differs from the new password. Type the same password in both fields.',
    privacyStoredTitle: "What Portolab stores",
    consentLabel: "I agree to the privacy notice",
    consentMissing:
      'Portolab stores your data only with your agreement. Read the privacy notice, then tick "I agree to the privacy notice".',
    finishButton: "Save and continue",
    accountTitle: "Your account",
    roleLabel: "Role",
    lecturerRole: "Lecturer",
    consented: ["You agreed to the privacy notice on ", " WIB."],
    privacyLink: "Read the privacy notice",
    changePasswordTitle: "Change your password",
    currentPasswordLabel: "Current password",
    changePasswordButton: "Change the password",
    passwordChanged:
      "Portolab saved your new password and signed you out on every other device.",
    wrongCurrentPassword:
      'The password in the field "Current password" is wrong. Type it again. After 10 wrong attempts within 15 minutes, Portolab blocks your username for a while, so that nobody can guess its password.',
    signOutButton: "Sign out",
    signOutTitle: "Sign out",
    signOutBody: "Sign out of Portolab on this device.",
    refusedTitle: "Portolab refused the form",
    refusedBody:
      "The form came from another site, or the browser did not say where it came from. Portolab refuses such a form, so that no other site can act in your name. Open Portolab directly and send the form again.",
  },
};

/** A pattern for a whole sentence whose parts surround values that a test cannot know in advance, such as the time of a block. */
function sentencePattern(parts: readonly string[]): RegExp {
  const escaped = parts.map((part) =>
    part.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  return new RegExp(`^${escaped.join(".+")}$`);
}

/** Sends the form in the main part of the page and waits for the answer of the server. */
async function submitMainForm(page: Page, buttonName: string): Promise<void> {
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST"),
    page.getByRole("main").getByRole("button", { name: buttonName }).click(),
  ]);
}

/** Sends the form that signs out from the page of the account as if another site sent it, and checks that Portolab refuses it and explains why. */
async function expectRefusedSignOutFromAnotherSite(
  page: Page,
  locale: Locale,
): Promise<void> {
  const text = texts[locale];
  await page.goto("/account");
  // A browser names the origin of the page that holds a form, and no page can change that header. So the test sends the request itself with the origin of another site, and gives its answer to the page.
  await page.route("**/sign-out*", async (route) => {
    const response = await route.fetch({
      headers: { ...route.request().headers(), origin: "https://example.com" },
    });
    await route.fulfill({ response });
  });
  await page
    .getByRole("main")
    .getByRole("button", { name: text.signOutButton })
    .click();
  await expect(page).toHaveTitle(`${text.refusedTitle} | Portolab`);
  await expect(
    page.getByRole("heading", { level: 1, name: text.refusedTitle }),
  ).toBeVisible();
  await expect(page.getByText(text.refusedBody)).toBeVisible();
  await page.unroute("**/sign-out*");
}

/** Fills the form that changes the password with a current password and a new one, and sends it. */
async function changePassword(
  page: Page,
  locale: Locale,
  currentPassword: string,
): Promise<void> {
  const text = texts[locale];
  await page.getByLabel(text.currentPasswordLabel).fill(currentPassword);
  await page
    .getByLabel(text.newPasswordLabel, { exact: true })
    .fill("a second long sentence");
  await page
    .getByLabel(text.repeatedPasswordLabel)
    .fill("a second long sentence");
  await submitMainForm(page, text.changePasswordButton);
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`creates the first lecturer with the account command, who signs in and finishes the account in ${language}`, async ({
    page,
  }) => {
    const username = uniqueUsername("dosen");
    const temporaryPassword = runAccountCommand("create-lecturer", username);
    await chooseLanguage(page, locale);
    await page.getByRole("link", { name: text.signInLink }).click();
    await expect(page).toHaveTitle(`${text.signInTitle} | Portolab`);
    await expect(
      page.getByRole("heading", { level: 1, name: text.signInTitle }),
    ).toBeVisible();
    await expect(page.getByText(text.forgotNotice)).toBeVisible();
    await expectAccessibleScreen(page);

    await page.getByLabel(text.usernameLabel).fill(username);
    await page
      .getByLabel(text.passwordLabel, { exact: true })
      .fill(temporaryPassword);
    await page
      .getByRole("main")
      .getByRole("button", { name: text.signInButton })
      .click();
    await expect(page).toHaveTitle(`${text.firstSetupTitle} | Portolab`);
    await expect(
      page.getByRole("heading", { level: 1, name: text.firstSetupTitle }),
    ).toBeVisible();
    await expect(page.getByText(text.firstSetupBody)).toBeVisible();
    await expect(page.getByText(text.lecturerNameHint)).toBeVisible();
    await expect(page.getByText(text.passwordHint)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: text.privacyStoredTitle }),
    ).toBeVisible();
    await expectAccessibleScreen(page);

    await page.getByLabel(text.nameLabel).fill(longName);
    await page.getByLabel(text.newPasswordLabel, { exact: true }).fill("short");
    await page.getByLabel(text.repeatedPasswordLabel).fill("short");
    await submitMainForm(page, text.finishButton);
    await expect(page.getByText(text.tooShort)).toBeVisible();
    await expect(page.getByText(text.consentMissing)).toBeVisible();
    await expect(page.getByLabel(text.nameLabel)).toHaveValue(longName);
    await expectAccessibleScreen(page);

    await page
      .getByLabel(text.newPasswordLabel, { exact: true })
      .fill(chosenPassword);
    await page
      .getByLabel(text.repeatedPasswordLabel)
      .fill("another long sentence");
    await page.getByLabel(text.consentLabel).check();
    await submitMainForm(page, text.finishButton);
    await expect(page.getByText(text.passwordsDiffer)).toBeVisible();

    await page
      .getByLabel(text.newPasswordLabel, { exact: true })
      .fill(chosenPassword);
    await page.getByLabel(text.repeatedPasswordLabel).fill(chosenPassword);
    await page.getByLabel(text.consentLabel).check();
    await page
      .getByRole("main")
      .getByRole("button", { name: text.finishButton })
      .click();
    await expect(page).toHaveURL("/");

    await page.getByRole("link", { name: text.accountLink }).click();
    await expect(page).toHaveTitle(`${text.accountTitle} | Portolab`);
    await expect(
      page.getByRole("heading", { level: 1, name: text.accountTitle }),
    ).toBeVisible();
    const details = page.getByRole("main").locator("dl");
    await expect(details).toContainText(text.nameLabel);
    await expect(details).toContainText(longName);
    await expect(details).toContainText(text.usernameLabel);
    await expect(details).toContainText(username);
    await expect(details).toContainText(text.roleLabel);
    await expect(details).toContainText(text.lecturerRole);
    await expect(page.getByText(sentencePattern(text.consented))).toBeVisible();
    await expect(
      page.getByRole("link", { name: text.privacyLink }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: text.changePasswordTitle }),
    ).toBeVisible();
    await expect(page.getByLabel(text.currentPasswordLabel)).toBeVisible();
    await expectAccessibleScreen(page);
  });

  test(`refuses a wrong password and blocks the username after too many in ${language}`, async ({
    page,
  }) => {
    const username = uniqueUsername("dosen");
    runAccountCommand("create-lecturer", username);
    await chooseLanguage(page, locale);
    await page.goto("/sign-in");
    await submitMainForm(page, text.signInButton);
    for (const failure of text.emptyFields) {
      await expect(page.getByText(failure, { exact: true })).toBeVisible();
    }
    await expectAccessibleScreen(page);
    await submitSignIn(page, username, "a wrong password");
    await expect(page.getByRole("alert")).toHaveText(text.wrongCredentials);
    await expect(page.getByLabel(text.usernameLabel)).toHaveValue(username);
    await expectAccessibleScreen(page);
    for (let attempt = 2; attempt <= 10; attempt += 1) {
      await page
        .getByLabel(text.passwordLabel, { exact: true })
        .fill("a wrong password");
      await submitMainForm(page, text.signInButton);
    }
    await page
      .getByLabel(text.passwordLabel, { exact: true })
      .fill("a wrong password");
    await submitMainForm(page, text.signInButton);
    await expect(page.getByRole("alert")).toHaveText(
      sentencePattern([
        `${text.blocked[0]}${username}${text.blocked[1]}`,
        text.blocked[2],
      ]),
    );
    await expectAccessibleScreen(page);
  });

  test(`changes the password, which signs out every other device, in ${language}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    const username = await signInAsNewLecturer(page, longName);
    const otherDevice = await browser.newPage();
    await otherDevice.goto("/sign-in");
    await submitSignIn(otherDevice, username, chosenPassword);
    await expect(otherDevice).toHaveURL("/");

    await page.goto("/account");
    await changePassword(page, locale, "a wrong password");
    await expect(page.getByRole("alert")).toHaveText(text.wrongCurrentPassword);
    await expectAccessibleScreen(page);

    await changePassword(page, locale, chosenPassword);
    await expect(page.getByRole("status")).toHaveText(text.passwordChanged);
    await expect(page.getByLabel(text.currentPasswordLabel)).toHaveValue("");
    await page.reload();
    await expect(page).toHaveURL("/account");

    await otherDevice.goto("/account");
    await expect(otherDevice).toHaveURL("/sign-in?returnTo=%2Faccount");
    await submitSignIn(otherDevice, username, "a second long sentence");
    await expect(otherDevice).toHaveURL("/account");
    await otherDevice.close();
  });

  test(`signs out, and signs in again to the page that asked for it, in ${language}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    const username = await signInAsNewLecturer(page, longName);
    await page.goto("/sign-out");
    await expect(page).toHaveTitle(`${text.signOutTitle} | Portolab`);
    await expect(
      page.getByRole("heading", { level: 1, name: text.signOutTitle }),
    ).toBeVisible();
    await expect(page.getByText(text.signOutBody)).toBeVisible();
    await expectAccessibleScreen(page);

    await page.goto("/account");
    await page
      .getByRole("main")
      .getByRole("button", { name: text.signOutButton })
      .click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("link", { name: text.signInLink }),
    ).toBeVisible();

    await page.goto("/account");
    await expect(page).toHaveURL("/sign-in?returnTo=%2Faccount");
    await submitSignIn(page, username, chosenPassword);
    await expect(page).toHaveURL("/account");
  });

  test(`refuses a form that another site sent in ${language}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, longName);
    await expectRefusedSignOutFromAnotherSite(page, locale);
    await expectAccessibleScreen(page);
    await page.goto("/account");
    await expect(page).toHaveURL("/account");
  });

  test.describe(`before JavaScript loads in ${language}`, () => {
    // Axe runs in the page, so the screens are checked in the tests with JavaScript, and these tests check that each form works without it.
    test.use({ javaScriptEnabled: false });

    test("signs in, finishes the account, and refuses a form from another site", async ({
      page,
    }) => {
      await chooseLanguage(page, locale);
      await signInAsNewLecturer(page, longName);
      await page.goto("/account");
      await expect(
        page.getByRole("heading", { level: 1, name: text.accountTitle }),
      ).toBeVisible();
      await expectRefusedSignOutFromAnotherSite(page, locale);
      await page.goto("/account");
      await expect(page).toHaveURL("/account");
    });
  });

  test(`gives a lecturer a temporary password with the account command, which asks for a new one, in ${language}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    const username = await signInAsNewLecturer(page, longName);
    const temporaryPassword = runAccountCommand("reset-password", username);
    await page.goto("/account");
    await expect(page).toHaveURL("/sign-in?returnTo=%2Faccount");
    await submitSignIn(page, username, temporaryPassword);
    await expect(page).toHaveTitle(`${text.newPasswordTitle} | Portolab`);
    await expect(
      page.getByRole("heading", { level: 1, name: text.newPasswordTitle }),
    ).toBeVisible();
    await expect(page.getByText(text.newPasswordBody)).toBeVisible();
    await expect(page.getByLabel(text.nameLabel)).toHaveCount(0);
    await expect(page.getByLabel(text.consentLabel)).toHaveCount(0);
    await expectAccessibleScreen(page);
    await page
      .getByLabel(text.newPasswordLabel, { exact: true })
      .fill("a third long sentence");
    await page
      .getByLabel(text.repeatedPasswordLabel)
      .fill("a third long sentence");
    await page
      .getByRole("main")
      .getByRole("button", { name: text.finishButton })
      .click();
    await expect(page).toHaveURL("/account");
  });
}

test("sends a person who signs in with a return path to another site to the home page", async ({
  page,
}) => {
  const username = await signInAsNewLecturer(page, longName);
  await page.goto("/account");
  await page
    .getByRole("main")
    .locator("form[action='/sign-out'] button")
    .click();
  await expect(page).toHaveURL("/");
  await page.goto(
    `/sign-in?returnTo=${encodeURIComponent("//example.com/account")}`,
  );
  await submitSignIn(page, username, chosenPassword);
  await expect(page).toHaveURL("/");
});

test("forbids every other site to show Portolab in a frame", async ({
  request,
}) => {
  for (const path of ["/", "/sign-in"]) {
    const response = await request.get(path);
    expect(response.headers()["content-security-policy"], path).toBe(
      "frame-ancestors 'none'",
    );
    expect(response.headers()["x-frame-options"], path).toBe("DENY");
  }
});
