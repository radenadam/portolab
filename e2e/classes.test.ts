import { expect, test } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import {
  chosenPassword,
  createTestClass,
  joinAsNewStudent,
  newDevice,
  signInAsNewLecturer,
  submitSignIn,
} from "./accounts.ts";
import { chooseLanguage } from "./choose-language.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";

// The longest names that the tests give, so each screen that shows them is checked with wide content.
const className =
  "Manajemen Portofolio dan Analisis Investasi Kelas Eksekutif Sabtu Pagi";
const lecturerName = "Budi Santoso";
const studentName = "Kusumawardhani Prameswari Wicaksono Hadiningrat";

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
    cashNotWhole: string;
    taughtClass: string;
    shareNotice: string;
    codeLabel: string;
    addressLabel: string;
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
    malformedCode: string;
    unknownCode: string;
    lecturerCannotJoin: string;
    lecturerOnly: string;
    joinClassTitle: string;
    joinClassBody: string;
    newAccountTitle: string;
    studentNameHint: string;
    usernameHint: string;
    createAccountButton: string;
    existingAccountLink: string;
    usernameTaken: string;
    joinButton: string;
    resetTitle: string;
    resetBody: string;
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
    cashNotWhole:
      'Kolom "Modal awal" menerima bilangan bulat rupiah, misalnya 100.000.000, tetapi isinya "seratus juta". Tulis jumlahnya dengan angka, dengan atau tanpa "." di antara kelompok angka.',
    taughtClass: "Mahasiswa: 1. Modal awal: Rp 100.000.000.",
    shareNotice:
      "Bagikan kode atau alamat ini kepada mahasiswa Anda. Setiap mahasiswa yang bergabung mulai dengan uang virtual sebesar Rp 100.000.000.",
    codeLabel: "Kode untuk bergabung",
    addressLabel: "Alamat untuk bergabung",
    studentsTitle: "Mahasiswa",
    noStudents: "Belum ada mahasiswa yang bergabung.",
    studentNotice: ['Masuk sebagai "', '". Bergabung pada ', " WIB."],
    resetLink: `Atur ulang kata sandi ${studentName}`,
    taughtBy: `${lecturerName} mengajar kelas ini.`,
    startingCash: "Anda mulai dengan uang virtual sebesar Rp 100.000.000.",
    joinedNotice: ["Anda bergabung ke kelas ini pada ", " WIB."],
    joinLink: "Gabung ke kelas dengan kodenya",
    homeJoinLink: "Gabung ke kelas dengan kodenya",
    homeClassesLink: "Kelas Anda",
    joinTitle: "Gabung ke kelas",
    joinBody: "Masukkan kode yang diberikan dosen Anda.",
    codeFieldLabel: "Kode kelas",
    continueButton: "Lanjutkan",
    malformedCode:
      'Kolom "Kode kelas" menerima kode kelas, yang terdiri dari 8 huruf dan angka, tetapi isinya "abc". Periksa kodenya dengan dosen Anda.',
    unknownCode:
      'Kolom "Kode kelas" berisi kode "aaaa-aaaa", tetapi tidak ada kelas dengan kode ini. Periksa kodenya dengan dosen Anda, lalu coba lagi.',
    lecturerCannotJoin:
      "Hanya mahasiswa yang bergabung ke kelas, dan Anda masuk sebagai dosen. Untuk bergabung sebagai mahasiswa, keluar terlebih dahulu.",
    lecturerOnly:
      "Hanya dosen yang membuat kelas, dan Anda masuk sebagai mahasiswa. Untuk mengajar kelas, mintalah akun dosen kepada orang yang menjalankan server Portolab ini.",
    joinClassTitle: `Gabung ke ${className}`,
    joinClassBody: `${lecturerName} mengajar kelas ini. Setiap mahasiswa mulai dengan uang virtual sebesar Rp 100.000.000.`,
    newAccountTitle: "Buat akun mahasiswa Anda",
    studentNameHint: "Dosen Anda melihat nama ini di samping pekerjaan Anda.",
    usernameHint:
      'Anda masuk dengan nama ini. Panjangnya 3 sampai 32 karakter dari a sampai z, 0 sampai 9, ".", "-", dan "_".',
    createAccountButton: "Buat akun dan gabung",
    existingAccountLink: "Masuk dengan akun yang sudah Anda miliki",
    usernameTaken:
      '", yang sudah dipakai akun lain. Pilih yang lain, misalnya dengan angka di akhirnya.',
    joinButton: "Gabung ke kelas",
    resetTitle: "Atur ulang kata sandi",
    resetBody: `Portolab memberi ${studentName}, yang masuk sebagai "`,
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
    cashNotWhole:
      'The field "Starting cash" takes a whole number of rupiah, such as 100,000,000, but it holds "seratus juta". Write the amount in digits, with or without "," between groups of digits.',
    taughtClass: "Students: 1. Starting cash: IDR 100,000,000.",
    shareNotice:
      "Share the code or the address with your students. Each student who joins starts with IDR 100,000,000 in virtual cash.",
    codeLabel: "Code for joining",
    addressLabel: "Address for joining",
    studentsTitle: "Students",
    noStudents: "No student has joined yet.",
    studentNotice: ['Signs in as "', '". Joined on ', " WIB."],
    resetLink: `Reset the password of ${studentName}`,
    taughtBy: `${lecturerName} teaches this class.`,
    startingCash: "You start with IDR 100,000,000 in virtual cash.",
    joinedNotice: ["You joined this class on ", " WIB."],
    joinLink: "Join a class with its code",
    homeJoinLink: "Join a class with its code",
    homeClassesLink: "Your classes",
    joinTitle: "Join a class",
    joinBody: "Enter the code that your lecturer gave you.",
    codeFieldLabel: "Code of the class",
    continueButton: "Continue",
    malformedCode:
      'The field "Code of the class" takes the code of a class, which has 8 letters and digits, but it holds "abc". Check the code with your lecturer.',
    unknownCode:
      'The field "Code of the class" holds the code "aaaa-aaaa", but no class has this code. Check the code with your lecturer and try again.',
    lecturerCannotJoin:
      "Only students join a class, and you are signed in as a lecturer. To join as a student, sign out first.",
    lecturerOnly:
      "Only a lecturer creates a class, and you are signed in as a student. To teach a class, ask the person who runs this Portolab server for a lecturer account.",
    joinClassTitle: `Join ${className}`,
    joinClassBody: `${lecturerName} teaches this class. Each student starts with IDR 100,000,000 in virtual cash.`,
    newAccountTitle: "Create your student account",
    studentNameHint: "Your lecturer sees this name next to your work.",
    usernameHint:
      'You sign in with it. It has 3 to 32 characters from a to z, 0 to 9, ".", "-", and "_".',
    createAccountButton: "Create the account and join",
    existingAccountLink: "Sign in with the account that you have",
    usernameTaken:
      '", which another account has. Choose another one, for example with a number at its end.',
    joinButton: "Join the class",
    resetTitle: "Reset a password",
    resetBody: `Portolab gives ${studentName}, who signs in as "`,
    resetButton: "Reset the password",
    temporaryPassword: `Give ${studentName} this temporary password. It works until they choose a new one.`,
    backLink: `Back to ${className}`,
    notFoundTitle: "Page not found",
    newPasswordTitle: "Choose a new password",
  },
};

// The other parts of the sentences that hold a username or a time, which the tests cannot know in advance.
const sentenceParts: Record<
  Locale,
  { usernameTaken: string; resetBody: string }
> = {
  id: {
    usernameTaken: 'Kolom "Nama pengguna" berisi nama pengguna "',
    resetBody:
      '", kata sandi sementara dan mengeluarkannya dari semua perangkat. Saat masuk berikutnya, ia memilih kata sandi baru.',
  },
  en: {
    usernameTaken: 'The field "Username" holds the username "',
    resetBody:
      '", a temporary password and signs them out on every device. At the next sign-in, they choose a new password.',
  },
};

for (const locale of locales) {
  const text = texts[locale];
  const parts = sentenceParts[locale];
  const language = languageNames[locale];

  test(`creates a class, which shows the code and the address that students join with, in ${language}`, async ({
    page,
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

    await page
      .getByLabel(text.cashLabel)
      .fill(locale === "id" ? "100.000.000" : "100,000,000");
    await page
      .getByRole("main")
      .getByRole("button", { name: text.createButton })
      .click();
    await expect(page).toHaveTitle(`${className} | Portolab`);
    await expect(
      page.getByRole("heading", { level: 1, name: className }),
    ).toBeVisible();
    await expect(page.getByText(text.shareNotice)).toBeVisible();
    await expect(page.getByText(text.codeLabel)).toBeVisible();
    await expect(page.getByText(text.addressLabel)).toBeVisible();
    await expect(page.locator("main dd").nth(0)).toHaveText(
      /^[a-km-np-z2-9]{4}-[a-km-np-z2-9]{4}$/,
    );
    await expect(
      page.getByRole("heading", { level: 2, name: text.studentsTitle }),
    ).toBeVisible();
    await expect(page.getByText(text.noStudents)).toBeVisible();
    await expectAccessibleScreen(page);
  });

  test(`lets a visitor join a class with its address by creating a student account in ${language}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    const lecturerUsername = await signInAsNewLecturer(page, lecturerName);
    const testClass = await createTestClass(page, className);

    const student = await newDevice(browser, locale);
    await student.goto(testClass.joinAddress);
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

    await student.locator('main input[name="name"]').fill(studentName);
    await student.locator('main input[name="username"]').fill(lecturerUsername);
    await student
      .locator('main input[name="newPassword"]')
      .fill(chosenPassword);
    await student
      .locator('main input[name="repeatedPassword"]')
      .fill(chosenPassword);
    await student.locator('main input[name="consent"]').check();
    await student
      .getByRole("main")
      .getByRole("button", { name: text.createAccountButton })
      .click();
    await expect(
      student.getByText(
        `${parts.usernameTaken}${lecturerUsername}${text.usernameTaken}`,
      ),
    ).toBeVisible();
    await expectAccessibleScreen(student);

    await joinAsNewStudent(student, testClass.joinAddress, studentName);
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

    await page.goto("/classes");
    await expect(page.getByText(text.taughtClass)).toBeVisible();
    await expectAccessibleScreen(page);
  });

  test(`lets a student who is signed in join with a code, and explains a wrong code, in ${language}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, lecturerName);
    const first = await createTestClass(page, className);
    const second = await createTestClass(page, `${className} B`);

    const student = await newDevice(browser, locale);
    await student.goto("/classes");
    await expect(student).toHaveURL("/sign-in?returnTo=%2Fclasses");
    await student.goto("/");
    await expect(
      student.getByRole("link", { name: text.homeJoinLink }),
    ).toBeVisible();
    await joinAsNewStudent(student, first.joinAddress, studentName);
    await student.goto("/join");
    await expect(student).toHaveTitle(`${text.joinTitle} | Portolab`);
    await expect(student.getByText(text.joinBody)).toBeVisible();
    for (const [code, failure] of [
      ["abc", text.malformedCode],
      ["AAAA AAAA", text.unknownCode],
    ] as const) {
      await student.getByLabel(text.codeFieldLabel).fill(code);
      await student
        .getByRole("main")
        .getByRole("button", { name: text.continueButton })
        .click();
      await expect(student.getByText(failure)).toBeVisible();
    }
    await expectAccessibleScreen(student);
    await student.getByLabel(text.codeFieldLabel).fill(second.joinCode);
    await student
      .getByRole("main")
      .getByRole("button", { name: text.continueButton })
      .click();
    await expect(student).toHaveURL(second.path);

    // A wrong code in an address shows the form for a code, which holds it, with the reason.
    const response = await student.goto("/join/aaaa-aaaa");
    expect(response?.status()).toBe(400);
    await expect(student).toHaveTitle(`${text.joinTitle} | Portolab`);
    await expect(student.getByText(text.unknownCode)).toBeVisible();
    await expect(student.getByLabel(text.codeFieldLabel)).toHaveValue(
      "aaaa-aaaa",
    );
    await expectAccessibleScreen(student);
    await student.getByLabel(text.codeFieldLabel).fill(first.joinCode);
    await student
      .getByRole("main")
      .getByRole("button", { name: text.continueButton })
      .click();
    await expect(student).toHaveURL(first.path);
    await student.context().close();
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
      testClass.joinAddress,
      studentName,
    );
    // A student who opens the address of a class again goes to the class.
    await student.goto(testClass.joinAddress);
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
      page.getByText(`${text.resetBody}${username}${parts.resetBody}`),
    ).toBeVisible();
    await expectAccessibleScreen(page);
    await page
      .getByRole("main")
      .getByRole("button", { name: text.resetButton })
      .click();
    await expect(page.getByText(text.temporaryPassword)).toBeVisible();
    const temporaryPassword =
      (await page.locator("main p").nth(1).textContent()) ?? "";
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
    await student
      .locator('main input[name="newPassword"]')
      .fill("a second long sentence");
    await student
      .locator('main input[name="repeatedPassword"]')
      .fill("a second long sentence");
    await student.locator("main form button[type=submit]").click();
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
    await joinAsNewStudent(member, testClass.joinAddress, studentName);
    await page.goto(testClass.path);
    const resetPath =
      (await page
        .getByRole("link", { name: text.resetLink })
        .getAttribute("href")) ?? "";

    const otherLecturer = await newDevice(browser, locale);
    await signInAsNewLecturer(otherLecturer, lecturerName);
    const otherClass = await createTestClass(otherLecturer, `${className} B`);
    const outsider = await newDevice(browser, locale);
    await joinAsNewStudent(outsider, otherClass.joinAddress, studentName);

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
      ]) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name ?? "";
        input.value = value ?? "";
        form.append(input);
      }
      document.body.append(form);
      form.submit();
    });
    expect((await refused).status()).toBe(403);
    await expect(member.getByRole("alert")).toHaveText(text.lecturerOnly);
    await expectAccessibleScreen(member);

    for (const path of ["/join", testClass.joinAddress]) {
      const response = await otherLecturer.goto(path);
      expect(response?.status(), path).toBe(403);
      await expect(
        otherLecturer.getByText(text.lecturerCannotJoin),
      ).toBeVisible();
    }
    await expectAccessibleScreen(otherLecturer);
    for (const device of [member, otherLecturer, outsider]) {
      await device.context().close();
    }
  });
}
