import { expect, test } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";
import { nameMaximumLength } from "../app/features/accounts/account-limits.ts";
import {
  classNameMaximumLength,
  startingCashLimits,
} from "../app/features/classes/class-rules.ts";
import { languageNames } from "../app/language-names.ts";
import { addressesForOthers } from "../app/local-network.server.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import {
  chosenPassword,
  joinAsNewStudent,
  signInAsNewLecturer,
  submitAccountForm,
  submitNewPassword,
  submitSignIn,
} from "./accounts.ts";
import { chooseLanguage } from "./choose-language.ts";
import { createTestClass, readTestClass } from "./create-test-class.ts";
import type { TestClass } from "./create-test-class.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { newDevice } from "./new-device.ts";
import { publicServerUrl } from "./test-server.ts";
import { wideWord } from "./wide-word.ts";

// The longest names that Portolab accepts, each one word, so each screen that shows a name is checked with its widest content.
const className = wideWord("Kelas", classNameMaximumLength);
const otherClassName = wideWord("KelasLain", classNameMaximumLength);
const lecturerName = wideWord("Dosen", nameMaximumLength);
const studentName = wideWord("Mahasiswa", nameMaximumLength);

const texts: Record<
  Locale,
  {
    classesTitle: string;
    noTaughtClasses: string;
    createTitle: string;
    nameLabel: string;
    nameHint: string;
    cashLabel: string;
    cashHint: string;
    createButton: string;
    typedCash: string;
    cashNotWhole: string;
    taughtClass: string;
    shareNotice: string;
    addressLabel: string;
    localNetworkNotice: string;
    severalNetworksNotice: string;
    noNetworkNotice: string;
    studentsTitle: string;
    noStudents: string;
    studentNotice: readonly [string, string, string];
    resetLink: string;
    taughtBy: string;
    startingCash: string;
    joinedNotice: readonly [string, string];
    joinLink: string;
    homeJoinLink: string;
    homeClassesLink: string;
    joinTitle: string;
    joinBody: string;
    codeFieldLabel: string;
    continueButton: string;
    malformedCode: readonly [string, string];
    unknownCode: readonly [string, string];
    lecturerCannotJoin: string;
    lecturerJoinTitle: string;
    lecturerOnly: string;
    lecturerOnlyTitle: string;
    joinClassTitle: string;
    joinClassBody: string;
    newAccountTitle: string;
    studentNameHint: string;
    usernameHint: string;
    createAccountButton: string;
    existingAccountLink: string;
    usernameTaken: readonly [string, string];
    joinButton: string;
    signOutButton: string;
    resetTitle: string;
    resetBody: readonly [string, string];
    resetButton: string;
    temporaryPassword: string;
    backLink: string;
    notFoundTitle: string;
    newPasswordTitle: string;
  }
> = {
  id: {
    classesTitle: "Kelas Anda",
    noTaughtClasses:
      "Anda belum mengajar kelas. Buat kelas di bawah, lalu bagikan kodenya kepada mahasiswa Anda.",
    createTitle: "Buat kelas",
    nameLabel: "Nama kelas",
    nameHint: "Mahasiswa Anda melihat nama ini.",
    cashLabel: "Modal awal",
    cashHint:
      "Uang virtual dalam rupiah bulat yang dimiliki setiap mahasiswa di awal.",
    createButton: "Buat kelas",
    typedCash: "1.000.000.000.000",
    cashNotWhole:
      'Kolom "Modal awal" menerima bilangan bulat rupiah, misalnya 100.000.000, tetapi isinya "seratus juta". Tulis jumlahnya dengan angka, dengan atau tanpa "." di antara kelompok angka seperti pada contoh.',
    taughtClass: "Mahasiswa: 1. Modal awal: Rp 1.000.000.000.000.",
    shareNotice:
      "Bagikan kode atau alamat ini kepada mahasiswa Anda. Setiap mahasiswa yang bergabung mulai dengan uang virtual sebesar Rp 1.000.000.000.000.",
    addressLabel: "Alamat untuk bergabung",
    localNetworkNotice:
      'Anda membuka Portolab di "localhost", yang hanya dapat dibuka oleh komputer ini. Karena itu, alamat untuk bergabung mengarah ke komputer ini di jaringannya, yang dapat dibuka oleh ponsel di jaringan Wi-Fi yang sama. Jika ponsel tidak dapat membukanya, firewall komputer ini atau jaringan Wi-Fi itu memblokir koneksinya. Izinkan koneksi itu di firewall, atau gunakan jaringan yang membolehkan perangkat saling terhubung, misalnya hotspot ponsel.',
    severalNetworksNotice:
      "Komputer ini terhubung ke beberapa jaringan, sehingga halaman ini menampilkan alamat di setiap jaringan, di bawah nama koneksinya. Berikan kepada mahasiswa Anda alamat di jaringan yang dipakai ponsel mereka.",
    noNetworkNotice:
      'Ponsel belum dapat membuka Portolab, karena Anda membukanya di "localhost", yang hanya dapat dibuka oleh komputer ini, dan komputer ini tidak terhubung ke jaringan mana pun. Hubungkan komputer ini ke jaringan Wi-Fi kelas, lalu muat ulang halaman ini untuk melihat alamat yang dipakai mahasiswa Anda untuk bergabung. Setiap mahasiswa yang bergabung mulai dengan uang virtual sebesar Rp 1.000.000.000.000.',
    studentsTitle: "Mahasiswa",
    noStudents: "Belum ada mahasiswa yang bergabung.",
    studentNotice: ['Masuk sebagai "', '". Bergabung pada ', " WIB."],
    resetLink: `Atur ulang kata sandi ${studentName}`,
    taughtBy: `${lecturerName} mengajar kelas ini.`,
    startingCash:
      "Anda mulai dengan uang virtual sebesar Rp 1.000.000.000.000.",
    joinedNotice: ["Anda bergabung ke kelas ini pada ", " WIB."],
    joinLink: "Gabung ke kelas dengan kodenya",
    homeJoinLink: "Gabung ke kelas dengan kodenya",
    homeClassesLink: "Kelas Anda",
    joinTitle: "Gabung ke kelas",
    joinBody: "Masukkan kode yang diberikan dosen Anda.",
    codeFieldLabel: "Kode kelas",
    continueButton: "Lanjutkan",
    malformedCode: [
      'Kolom "Kode kelas" menerima kode kelas, yang terdiri dari 8 huruf dan angka tanpa "l", "o", "0", atau "1", tetapi isinya "',
      '". Periksa kodenya dengan dosen Anda.',
    ],
    unknownCode: [
      'Kolom "Kode kelas" berisi "',
      '", tetapi tidak ada kelas dengan kode ini. Periksa kodenya dengan dosen Anda, lalu coba lagi.',
    ],
    lecturerCannotJoin:
      "Hanya mahasiswa yang bergabung ke kelas, dan Anda masuk sebagai dosen. Untuk bergabung sebagai mahasiswa, keluar terlebih dahulu.",
    lecturerJoinTitle: "Dosen tidak dapat bergabung ke kelas",
    lecturerOnlyTitle: "Mahasiswa tidak dapat membuat kelas",
    lecturerOnly:
      "Hanya dosen yang membuat kelas, dan Anda masuk sebagai mahasiswa. Untuk mengajar kelas, mintalah akun dosen kepada orang yang menjalankan server Portolab ini.",
    joinClassTitle: `Gabung ke ${className}`,
    joinClassBody: `${lecturerName} mengajar kelas ini. Setiap mahasiswa mulai dengan uang virtual sebesar Rp 1.000.000.000.000.`,
    newAccountTitle: "Buat akun mahasiswa Anda",
    studentNameHint: "Dosen Anda melihat nama ini di samping pekerjaan Anda.",
    usernameHint:
      'Anda masuk dengan nama ini. Panjangnya 3 sampai 32 karakter dari a sampai z, 0 sampai 9, ".", "-", dan "_".',
    createAccountButton: "Buat akun dan gabung",
    existingAccountLink: "Masuk dengan akun yang sudah Anda miliki",
    usernameTaken: [
      'Kolom "Nama pengguna" berisi "',
      '", tetapi akun lain sudah memakai nama pengguna ini. Pilih yang lain, misalnya nama pengguna ini dengan angka di akhirnya.',
    ],
    joinButton: "Gabung ke kelas",
    signOutButton: "Keluar",
    resetTitle: "Atur ulang kata sandi",
    resetBody: [
      `Portolab memberi ${studentName}, yang masuk sebagai "`,
      '", kata sandi sementara dan mengeluarkannya dari semua perangkat. Saat masuk berikutnya, ia memilih kata sandi baru.',
    ],
    resetButton: "Atur ulang kata sandi",
    temporaryPassword: `Berikan kata sandi sementara ini kepada ${studentName}. Kata sandi ini berlaku sampai ia memilih kata sandi baru.`,
    backLink: `Kembali ke ${className}`,
    notFoundTitle: "Halaman tidak ditemukan",
    newPasswordTitle: "Pilih kata sandi baru",
  },
  en: {
    classesTitle: "Your classes",
    noTaughtClasses:
      "You teach no class yet. Create one below, then share its code with your students.",
    createTitle: "Create a class",
    nameLabel: "Name of the class",
    nameHint: "Your students see this name.",
    cashLabel: "Starting cash",
    cashHint: "The virtual cash in whole rupiah that each student starts with.",
    createButton: "Create the class",
    typedCash: "1,000,000,000,000",
    cashNotWhole:
      'The field "Starting cash" takes a whole number of rupiah, such as 100,000,000, but it holds "seratus juta". Write the amount in digits, with or without "," between groups of digits as the example shows.',
    taughtClass: "Students: 1. Starting cash: IDR 1,000,000,000,000.",
    shareNotice:
      "Share the code or the address with your students. Each student who joins starts with IDR 1,000,000,000,000 in virtual cash.",
    addressLabel: "Address for joining",
    localNetworkNotice:
      'You opened Portolab at "localhost", which only this computer can open. So the address for joining leads to this computer on its network, which phones on the same Wi-Fi network can open. When a phone cannot open it, the firewall of this computer or the Wi-Fi network blocks the connection. Allow the connection in the firewall, or use a network that lets devices reach each other, such as the hotspot of a phone.',
    severalNetworksNotice:
      "This computer is on several networks, so the page shows the address on each, under the name of its connection. Give your students the address on the network that their phones use.",
    noNetworkNotice:
      'Phones cannot open Portolab yet, because you opened it at "localhost", which only this computer can open, and this computer is on no network. Connect it to the Wi-Fi network of the class, then reload this page for the address that your students join with. Each student who joins starts with IDR 1,000,000,000,000 in virtual cash.',
    studentsTitle: "Students",
    noStudents: "No student has joined yet.",
    studentNotice: ['Signs in as "', '". Joined on ', " WIB."],
    resetLink: `Reset the password of ${studentName}`,
    taughtBy: `${lecturerName} teaches this class.`,
    startingCash: "You start with IDR 1,000,000,000,000 in virtual cash.",
    joinedNotice: ["You joined this class on ", " WIB."],
    joinLink: "Join a class with its code",
    homeJoinLink: "Join a class with its code",
    homeClassesLink: "Your classes",
    joinTitle: "Join a class",
    joinBody: "Enter the code that your lecturer gave you.",
    codeFieldLabel: "Code of the class",
    continueButton: "Continue",
    malformedCode: [
      'The field "Code of the class" takes the code of a class, which has 8 letters and digits without "l", "o", "0", or "1", but it holds "',
      '". Check the code with your lecturer.',
    ],
    unknownCode: [
      'The field "Code of the class" holds "',
      '", but no class has this code. Check the code with your lecturer and try again.',
    ],
    lecturerCannotJoin:
      "Only students join a class, and you are signed in as a lecturer. To join as a student, sign out first.",
    lecturerJoinTitle: "A lecturer cannot join a class",
    lecturerOnlyTitle: "A student cannot create a class",
    lecturerOnly:
      "Only lecturers create a class, and you are signed in as a student. To teach a class, ask the person who runs this Portolab server for a lecturer account.",
    joinClassTitle: `Join ${className}`,
    joinClassBody: `${lecturerName} teaches this class. Each student starts with IDR 1,000,000,000,000 in virtual cash.`,
    newAccountTitle: "Create your student account",
    studentNameHint: "Your lecturer sees this name next to your work.",
    usernameHint:
      'You sign in with it. It has 3 to 32 characters from a to z, 0 to 9, ".", "-", and "_".',
    createAccountButton: "Create the account and join",
    existingAccountLink: "Sign in with the account that you have",
    usernameTaken: [
      'The field "Username" holds "',
      '", but another account has this username. Choose another one, such as this username with a number at its end.',
    ],
    joinButton: "Join the class",
    signOutButton: "Sign out",
    resetTitle: "Reset a password",
    resetBody: [
      `Portolab gives ${studentName}, who signs in as "`,
      '", a temporary password and signs them out on every device. At the next sign-in, they choose a new password.',
    ],
    resetButton: "Reset the password",
    temporaryPassword: `Give ${studentName} this temporary password. It works until they choose a new one.`,
    backLink: `Back to ${className}`,
    notFoundTitle: "Page not found",
    newPasswordTitle: "Choose a new password",
  },
};

/** Types a code in the form for a code and sends it. */
async function enterCode(
  page: Page,
  locale: Locale,
  code: string,
): Promise<void> {
  const text = texts[locale];
  await page.getByLabel(text.codeFieldLabel).fill(code);
  await page
    .getByRole("main")
    .getByRole("button", { name: text.continueButton })
    .click();
}

/** Signs in with the chosen password on the sign-in page that a page sent the reader to, and checks that the sign-in page got the path of that page and returns there. */
async function signInAndReturn(
  page: Page,
  { path, username }: { path: string; username: string },
): Promise<void> {
  await expect(page).toHaveURL(`/sign-in?returnTo=${encodeURIComponent(path)}`);
  await submitSignIn(page, username, chosenPassword);
  await expect(page).toHaveURL(path);
}

/** Signs out in another tab of the same device, so the session of the page that a test holds ends without the page knowing. */
async function signOutInAnotherTab(page: Page): Promise<void> {
  const otherTab = await page.context().newPage();
  await otherTab.goto("/account");
  await otherTab
    .getByRole("main")
    .locator("form[action='/sign-out'] button")
    .click();
  await expect(otherTab).toHaveURL("/");
  await otherTab.close();
}

/** Checks that a page shows the form for a code with a code that opens no class, in its field and in the error at that field. */
async function expectUnknownCodeForm(
  page: Page,
  locale: Locale,
  code: string,
): Promise<void> {
  const text = texts[locale];
  await expect(page).toHaveTitle(`${text.joinTitle} | Portolab`);
  await expect(
    page.getByText(`${text.unknownCode[0]}${code}${text.unknownCode[1]}`),
  ).toBeVisible();
  await expect(page.getByLabel(text.codeFieldLabel)).toHaveValue(code);
  await expectAccessibleScreen(page);
}

/** Checks the page of a class that its lecturer opened at localhost. It shows the address for joining on each network of this computer, which runs the test server, and a device of a student opens each at the page that joins the class. A computer on no network gets the notice that tells the lecturer to connect it instead. */
async function expectAddressesForPhones(
  page: Page,
  browser: Browser,
  { locale, testClass }: { locale: Locale; testClass: TestClass },
): Promise<void> {
  const text = texts[locale];
  const forOthers = addressesForOthers(new URL(testClass.joinPath, page.url()));
  switch (forOthers.kind) {
    case "asOpened":
      throw new Error(
        `The test opened ${page.url()}, which other devices can open as well, so it cannot check the addresses on the local network.`,
      );
    case "noNetwork":
      await expect(page.getByText(text.noNetworkNotice)).toBeVisible();
      await expect(page.getByText(text.shareNotice)).toHaveCount(0);
      await expect(page.locator("main dd")).toHaveText([testClass.joinCode]);
      return;
    case "onLocalNetwork": {
      await expect(page.getByText(text.shareNotice)).toBeVisible();
      await expect(
        page.getByText(text.addressLabel, { exact: true }),
      ).toBeVisible();
      await expect(page.getByText(text.localNetworkNotice)).toBeVisible();
      await expect(page.getByText(text.severalNetworksNotice)).toHaveCount(
        forOthers.addresses.length > 1 ? 1 : 0,
      );
      // The first value is the code, and an address for each network follows it.
      const values = page.locator("main dd");
      await expect(values).toHaveCount(1 + forOthers.addresses.length);
      const student = await newDevice(browser, locale);
      for (const [
        index,
        { connectionName, address },
      ] of forOthers.addresses.entries()) {
        const shown = values.nth(1 + index);
        await expect(shown).toContainText(connectionName);
        await expect(shown).toContainText(address);
        await student.goto(address);
        await expect(
          student.getByRole("heading", { level: 1 }),
          address,
        ).toContainText(className);
      }
      await student.context().close();
    }
  }
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`creates a class, which shows the code and the addresses on the local network that phones join with, in ${language}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, lecturerName);
    await expect(page).toHaveTitle(`${text.classesTitle} | Portolab`);
    await expect(page.getByText(text.noTaughtClasses)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: text.createTitle }),
    ).toBeVisible();
    await expect(page.getByText(text.nameHint)).toBeVisible();
    await expect(page.getByText(text.cashHint)).toBeVisible();
    await expectAccessibleScreen(page);

    await page.getByLabel(text.nameLabel).fill(className);
    await page.getByLabel(text.cashLabel).fill("seratus juta");
    await page
      .getByRole("main")
      .getByRole("button", { name: text.createButton })
      .click();
    await expect(page.getByText(text.cashNotWhole)).toBeVisible();
    await expect(page.getByLabel(text.nameLabel)).toHaveValue(className);
    await expectAccessibleScreen(page);

    // The lecturer types the most cash that Portolab accepts, so the screens below show their widest amount.
    expect(Number(text.typedCash.replaceAll(/\D/g, ""))).toBe(
      startingCashLimits.maximum,
    );
    await page.getByLabel(text.cashLabel).fill(text.typedCash);
    // The test holds the answer to the form, as a slow network would, so that it can see the button wait instead of sending the form a second time.
    const { promise: heldAnswer, resolve: releaseAnswer } =
      Promise.withResolvers<undefined>();
    await page.route(/\.data(\?|$)/, async (route) => {
      await heldAnswer;
      await route.fallback();
    });
    const createButton = page
      .getByRole("main")
      .getByRole("button", { name: text.createButton });
    await createButton.click();
    await expect(createButton).toBeDisabled();
    releaseAnswer(undefined);
    await expect(page).toHaveTitle(`${className} | Portolab`);
    await page.unroute(/\.data(\?|$)/);
    await expect(
      page.getByRole("heading", { level: 1, name: className }),
    ).toBeVisible();
    await expect(
      page.getByText(text.codeFieldLabel, { exact: true }),
    ).toBeVisible();
    await expect(page.locator("main dd").nth(0)).toHaveText(
      /^[a-km-np-z2-9]{4}-[a-km-np-z2-9]{4}$/,
    );
    await expect(
      page.getByRole("heading", { level: 2, name: text.studentsTitle }),
    ).toBeVisible();
    await expect(page.getByText(text.noStudents)).toBeVisible();
    await expectAccessibleScreen(page);
    await expectAddressesForPhones(page, browser, {
      locale,
      testClass: await readTestClass(page),
    });
  });

  test(`lets a visitor join a class on a public server with the address that its lecturer shares by creating a student account in ${language}`, async ({
    browser,
  }) => {
    const lecturer = await newDevice(browser, locale, publicServerUrl);
    const lecturerUsername = await signInAsNewLecturer(lecturer, lecturerName);
    const testClass = await createTestClass(lecturer, className);
    // A public server keeps the address that the lecturer opened, which the phone of a student opens as well.
    const joinAddress = new URL(testClass.joinPath, publicServerUrl).href;
    await expect(lecturer.getByText(text.shareNotice)).toBeVisible();
    await expect(
      lecturer.getByText(text.addressLabel, { exact: true }),
    ).toBeVisible();
    await expect(lecturer.locator("main dd")).toHaveText([
      testClass.joinCode,
      joinAddress,
    ]);
    await expect(lecturer.getByText(text.localNetworkNotice)).toHaveCount(0);
    await expectAccessibleScreen(lecturer);

    const student = await newDevice(browser, locale, publicServerUrl);
    await student.goto(joinAddress);
    await expect(student).toHaveTitle(`${text.joinClassTitle} | Portolab`);
    await expect(
      student.getByRole("heading", { level: 1, name: text.joinClassTitle }),
    ).toBeVisible();
    await expect(student.getByText(text.joinClassBody)).toBeVisible();
    await expect(
      student.getByRole("heading", { level: 2, name: text.newAccountTitle }),
    ).toBeVisible();
    await expect(student.getByText(text.studentNameHint)).toBeVisible();
    await expect(student.getByText(text.usernameHint)).toBeVisible();
    await expect(
      student.getByRole("link", { name: text.existingAccountLink }),
    ).toBeVisible();
    await expectAccessibleScreen(student);

    // The error quotes the username as the field shows it, and Portolab reads a username in lowercase.
    const typedUsername = lecturerUsername.toUpperCase();
    await submitAccountForm(student, {
      name: studentName,
      username: typedUsername,
    });
    await expect(
      student.getByText(
        `${text.usernameTaken[0]}${typedUsername}${text.usernameTaken[1]}`,
      ),
    ).toBeVisible();
    await expectAccessibleScreen(student);

    // A class can go away between the load of its page and the form, such as when the person who runs the server deletes it. The test sends the form to a code of no class to stand for that.
    const isFormToJoin = (url: URL): boolean =>
      url.pathname.startsWith(testClass.joinPath);
    await student.route(isFormToJoin, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await route.continue({
        url: route
          .request()
          .url()
          .replace(testClass.joinPath, "/join/aaaa-aaaa"),
      });
    });
    await student
      .getByRole("main")
      .getByRole("button", { name: text.createAccountButton })
      .click();
    await expectUnknownCodeForm(student, locale, "aaaa-aaaa");
    await student.unroute(isFormToJoin);

    await joinAsNewStudent(student, joinAddress, studentName);
    await expect(student).toHaveTitle(`${className} | Portolab`);
    await expect(student.getByText(text.taughtBy)).toBeVisible();
    await expect(student.getByText(text.startingCash)).toBeVisible();
    await expect(
      student.getByText(text.joinedNotice[0], { exact: false }),
    ).toContainText(text.joinedNotice[1]);
    await expectAccessibleScreen(student);

    await student.goto("/classes");
    await expect(student.getByRole("link", { name: className })).toBeVisible();
    await expect(student.getByText(text.taughtBy)).toBeVisible();
    await expect(
      student.getByRole("link", { name: text.joinLink }),
    ).toBeVisible();
    await expectAccessibleScreen(student);
    await student.goto("/");
    await expect(
      student.getByRole("link", { name: text.homeClassesLink }),
    ).toBeVisible();
    await student.context().close();

    await lecturer.goto("/classes");
    await expect(lecturer.getByText(text.taughtClass)).toBeVisible();
    await expectAccessibleScreen(lecturer);
    await lecturer.context().close();
  });

  test(`lets a student who is signed in join with a code, and explains a wrong code, in ${language}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, lecturerName);
    const first = await createTestClass(page, className);
    const second = await createTestClass(page, otherClassName);
    const third = await createTestClass(page, className);

    const student = await newDevice(browser, locale);
    await student.goto("/classes");
    await expect(student).toHaveURL("/sign-in?returnTo=%2Fclasses");
    await student.goto("/");
    await expect(
      student.getByRole("link", { name: text.homeJoinLink }),
    ).toBeVisible();
    const username = await joinAsNewStudent(
      student,
      first.joinPath,
      studentName,
    );
    await student.goto("/join");
    await expect(student).toHaveTitle(`${text.joinTitle} | Portolab`);
    await expect(student.getByText(text.joinBody)).toBeVisible();
    for (const [code, failure] of [
      ["abc", text.malformedCode],
      ["AAAA AAAA", text.unknownCode],
    ] as const) {
      await enterCode(student, locale, code);
      await expect(
        student.getByText(`${failure[0]}${code}${failure[1]}`),
      ).toBeVisible();
    }
    await expectAccessibleScreen(student);
    await enterCode(student, locale, second.joinCode);
    await expect(student).toHaveURL(second.path);

    const response = await student.goto("/join/aaaa-aaaa");
    expect(response?.status()).toBe(400);
    await expectUnknownCodeForm(student, locale, "aaaa-aaaa");
    await enterCode(student, locale, first.joinCode);
    await expect(student).toHaveURL(first.path);
    await student.context().close();

    const otherDevice = await newDevice(browser, locale);
    await otherDevice.goto(third.joinPath);
    await otherDevice
      .getByRole("link", { name: text.existingAccountLink })
      .click();
    await signInAndReturn(otherDevice, { path: third.joinPath, username });
    await expect(otherDevice).toHaveTitle(`${text.joinClassTitle} | Portolab`);
    await expect(otherDevice.getByText(text.joinClassBody)).toBeVisible();
    await expectAccessibleScreen(otherDevice);

    // A session can end between the load of the page and the tap on its button, such as through a sign-out in another tab, and the tap then asks the student to sign in again.
    await signOutInAnotherTab(otherDevice);
    await otherDevice
      .getByRole("main")
      .getByRole("button", { name: text.joinButton })
      .click();
    await signInAndReturn(otherDevice, { path: third.joinPath, username });
    await otherDevice
      .getByRole("main")
      .getByRole("button", { name: text.joinButton })
      .click();
    await expect(otherDevice).toHaveURL(third.path);

    // A link inside the app asks for its page as data, and the sign-in page still returns to the page itself.
    await signOutInAnotherTab(otherDevice);
    await otherDevice.locator('header a[href="/account"]').click();
    await expect(otherDevice).toHaveURL("/sign-in?returnTo=%2Faccount");
    await otherDevice.context().close();
  });

  test(`lets a lecturer reset the password of a student, who then chooses a new one, in ${language}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, lecturerName);
    const testClass = await createTestClass(page, className);
    const student = await newDevice(browser, locale);
    const username = await joinAsNewStudent(
      student,
      testClass.joinPath,
      studentName,
    );
    await student.goto(testClass.joinPath);
    await expect(student).toHaveURL(testClass.path);

    await page.goto(testClass.path);
    await expect(page.getByText(studentName, { exact: true })).toBeVisible();
    await expect(
      page.getByText(
        `${text.studentNotice[0]}${username}${text.studentNotice[1]}`,
      ),
    ).toContainText(text.studentNotice[2]);
    await expectAccessibleScreen(page);
    await page.getByRole("link", { name: text.resetLink }).click();
    await expect(page).toHaveTitle(`${text.resetTitle} | Portolab`);
    await expect(
      page.getByText(`${text.resetBody[0]}${username}${text.resetBody[1]}`),
    ).toBeVisible();
    await expectAccessibleScreen(page);
    await page
      .getByRole("main")
      .getByRole("button", { name: text.resetButton })
      .click();
    await expect(page.getByText(text.temporaryPassword)).toBeVisible();
    const temporaryPassword = await page.locator("main p").nth(1).innerText();
    expect(temporaryPassword).toMatch(
      /^[a-km-np-z2-9]{4}(-[a-km-np-z2-9]{4}){2}$/,
    );
    await expectAccessibleScreen(page);
    await page.getByRole("link", { name: text.backLink }).click();
    await expect(page).toHaveURL(testClass.path);

    await student.goto(testClass.path);
    await expect(student).toHaveURL(
      `/sign-in?returnTo=${encodeURIComponent(testClass.path)}`,
    );
    await submitSignIn(student, username, temporaryPassword);
    await expect(student).toHaveTitle(`${text.newPasswordTitle} | Portolab`);
    await submitNewPassword(student, "a second long sentence");
    await expect(student).toHaveURL(testClass.path);
    await student.context().close();
  });

  test(`shows a class and its students only to its lecturer and to its students in ${language}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, lecturerName);
    const testClass = await createTestClass(page, className);
    const member = await newDevice(browser, locale);
    await joinAsNewStudent(member, testClass.joinPath, studentName);
    await page.goto(testClass.path);
    const resetPath = await page
      .getByRole("link", { name: text.resetLink })
      .getAttribute("href");
    if (resetPath === null) {
      throw new Error(
        "The link that resets the password of a student has no address.",
      );
    }

    const otherLecturer = await newDevice(browser, locale);
    await signInAsNewLecturer(otherLecturer, lecturerName);
    const otherClass = await createTestClass(otherLecturer, otherClassName);
    const outsider = await newDevice(browser, locale);
    await joinAsNewStudent(outsider, otherClass.joinPath, studentName);

    for (const [device, path] of [
      [otherLecturer, testClass.path],
      [otherLecturer, resetPath],
      [outsider, testClass.path],
      [member, resetPath],
      [member, "/classes/0"],
    ] as const) {
      const response = await device.goto(path);
      expect(response?.status(), path).toBe(404);
      await expect(
        device.getByRole("heading", { level: 1, name: text.notFoundTitle }),
      ).toBeVisible();
    }
    await expectAccessibleScreen(member);

    // The page of a student has no form for a class, so the test sends one as a forged page would, from this site.
    await member.goto("/classes");
    const refused = member.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === "/classes",
    );
    await member.evaluate(() => {
      const form = document.createElement("form");
      form.method = "post";
      form.action = "/classes";
      for (const [name, value] of [
        ["name", "Kelas Palsu"],
        ["startingCash", "100000000"],
      ] as const) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
    });
    expect((await refused).status()).toBe(403);
    await expect(member).toHaveTitle(`${text.lecturerOnlyTitle} | Portolab`);
    await expect(
      member.getByRole("heading", { level: 1, name: text.lecturerOnlyTitle }),
    ).toBeVisible();
    await expect(member.getByText(text.lecturerOnly)).toBeVisible();
    await expectAccessibleScreen(member);

    for (const path of ["/join", testClass.joinPath]) {
      const response = await otherLecturer.goto(path);
      expect(response?.status(), path).toBe(403);
      await expect(otherLecturer).toHaveTitle(
        `${text.lecturerJoinTitle} | Portolab`,
      );
      await expect(
        otherLecturer.getByRole("heading", {
          level: 1,
          name: text.lecturerJoinTitle,
        }),
      ).toBeVisible();
      await expect(
        otherLecturer.getByText(text.lecturerCannotJoin),
      ).toBeVisible();
    }
    await expectAccessibleScreen(otherLecturer);
    await otherLecturer
      .getByRole("main")
      .getByRole("button", { name: text.signOutButton })
      .click();
    await expect(otherLecturer).toHaveURL("/");
    await otherLecturer.goto(testClass.joinPath);
    await expect(
      otherLecturer.getByRole("heading", {
        level: 2,
        name: text.newAccountTitle,
      }),
    ).toBeVisible();
    for (const device of [member, otherLecturer, outsider]) {
      await device.context().close();
    }
  });
}
