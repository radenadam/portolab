import { chooseLanguage } from "./choose-language.ts";
import { signInAsNewLecturer } from "./accounts.ts";
import { createTestClass } from "./create-test-class.ts";
import { languageNames } from "../app/language-names.ts";
import { expect, test } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";
import type { ClassMapSection } from "../app/features/classes/class-path.ts";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { storeTestJoiningTime } from "./store-test-joining-time.ts";
import type { Locale } from "../app/paraglide/runtime.js";
import { locales } from "../app/paraglide/runtime.js";
import { bbcaHolding } from "./bbca-holding.ts";
import { openClassAdministration, openJoinDetails } from "./class-controls.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { newDevice } from "./new-device.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { expectMapLabelsClear } from "./expect-map-labels-clear.ts";
import { fillClassMap } from "./fill-class-map.ts";

const texts: Record<
  Locale,
  {
    calendar: string;
    saveCalendar: string;
    title: string;
    deviation: string;
    axis: string;
    table: string;
    help: string;
    join: string;
    copied: readonly [string, string];
    failed: string;
    copy: string;
    chip: readonly [string, string];
    viewChip: readonly [string, string];
    startingCash: string;
    empty: string;
    back: string;
    studentTabs: readonly string[];
  }
> = {
  id: {
    studentTabs: ["Analisis", "Jurnal dan order"],
    calendar: "Atur tanggal sesi 1",
    saveCalendar: "Simpan tanggal",
    back: `Kembali ke ${widestClassNames.className}`,
    empty:
      "Belum ada mahasiswa yang bergabung. Bagikan kode gabung di bagian atas halaman agar mahasiswa dapat bergabung.",
    startingCash: "Modal awal",
    title: "Peta risiko dan imbal hasil",
    deviation: "Simpangan baku",
    axis: "Simpangan baku per bulan",
    table: "Lihat data mahasiswa dan waktu harga",
    help: "Apa itu Peta risiko dan imbal hasil?",
    join: "Kode gabung",
    copied: ["Kode ", " tersalin."],
    failed: "Browser menolak menyalin otomatis. Pilih kode lalu salin.",
    copy: "Salin kode",
    chip: ["Kode gabung ", ". Salin kode dan lihat alamat gabung"],
    viewChip: ["Kode gabung ", ". Lihat kode dan alamat gabung"],
  },
  en: {
    studentTabs: ["Analysis", "Journal and orders"],
    calendar: "Set the date of session 1",
    saveCalendar: "Save the date",
    back: `Back to ${widestClassNames.className}`,
    empty:
      "No student has joined yet. Share the join code at the top of the page so that students can join.",
    startingCash: "Starting cash",
    title: "Risk and return map",
    deviation: "Standard deviation",
    axis: "Standard deviation per month",
    table: "View student data and price times",
    help: "What is Risk and return map?",
    join: "Join code",
    copied: ["Code ", " copied."],
    failed:
      "The browser refused automatic copying. Select the code and copy it.",
    copy: "Copy code",
    chip: ["Join code ", ". Copy the code and view join addresses"],
    viewChip: ["Join code ", ". View the code and join addresses"],
  },
};

const sourceAxis = "deviation";

const classMapJoinedAt = new Date("2026-10-26T03:00:00Z");

const labelScenarios: {
  width: number;
  axis: string;
  colorScheme: "light" | "dark";
}[] = [];
for (const width of [360, 1440, 1920]) {
  for (const axis of ["beta", "deviation"]) {
    for (const colorScheme of ["light", "dark"] as const) {
      labelScenarios.push({ width, axis, colorScheme });
    }
  }
}

for (const locale of locales) {
  test(`offers the join code before the first student joins, with and without JavaScript, in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, widestClassNames.lecturerName);
    const taught = await createTestClass(page, widestClassNames.className);
    const plain = await newDevice(browser, locale, {
      javaScriptEnabled: false,
      sessionFrom: page,
    });
    try {
      for (const screen of [page, plain]) {
        await screen.goto(taught.path);
        await expect(
          screen.getByText(texts[locale].empty, { exact: true }),
        ).toBeVisible();
        await expect(screen.getByRole("table")).toHaveCount(0);
        await expect(
          screen.getByRole("button", { name: texts[locale].help, exact: true }),
        ).toHaveCount(0);
        const details = await openJoinDetails(screen);
        await expect(details.locator("dd").first()).toHaveText(taught.joinCode);
        expect(await layoutProblems(screen)).toEqual([]);
      }
      // Axe injects frame scripts, so its audit needs the context with JavaScript enabled.
      await expectAccessibleScreen(page);
    } finally {
      await plain.context().close();
    }
  });
  test(`returns to the source disclosure and student row, with and without JavaScript, in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      { locale, ...widestClassNames },
    );
    storeClassMapHolding(classId);
    const plain = await newDevice(browser, locale, {
      javaScriptEnabled: false,
      sessionFrom: page,
    });
    try {
      for (const screen of [page, plain]) {
        await screen.goto(`${classPath}?axis=${sourceAxis}`);
        await screen.getByText(texts[locale].table, { exact: true }).click();
        const studentLink = screen.locator("main table").getByRole("link", {
          name: widestClassNames.studentName,
          exact: true,
        });
        const rowId = await screen
          .locator("tbody tr")
          .first()
          .getAttribute("id");
        await studentLink.click();
        for (const tab of texts[locale].studentTabs) {
          await screen.getByRole("link", { name: tab, exact: true }).click();
        }
        await screen
          .getByRole("link", { name: texts[locale].back, exact: true })
          .click();
        await expectClassReturn(screen, studentLink, {
          section: "data",
          targetId: rowId,
        });
        await screen.goto(`${classPath}?axis=${sourceAxis}`);
        await openClassAdministration(screen);
        const administration = screen.locator("[data-class-administration]");
        const resetLink = administration
          .locator("li")
          .first()
          .getByRole("link");
        const resetRowId = await administration
          .locator("li")
          .first()
          .getAttribute("id");
        await resetLink.click();
        await screen
          .getByRole("link", { name: texts[locale].back, exact: true })
          .click();
        await expectClassReturn(screen, resetLink, {
          section: "administration",
          targetId: resetRowId,
        });
        const calendarSource = {
          section: "administration",
          targetId: await administration.getAttribute("id"),
        } as const;
        const calendar = administration.getByRole("link", {
          name: texts[locale].calendar,
          exact: true,
        });
        await calendar.click();
        await screen
          .getByRole("link", { name: texts[locale].back, exact: true })
          .click();
        await expectClassReturn(screen, calendar, calendarSource);
        await calendar.click();
        await screen
          .locator('input[name="firstSessionDate"]')
          .fill("2026-10-26");
        await screen
          .getByRole("button", {
            name: texts[locale].saveCalendar,
            exact: true,
          })
          .click();
        await expectClassReturn(screen, calendar, calendarSource);
        expect(await layoutProblems(screen)).toEqual([]);
      }
    } finally {
      await plain.context().close();
      await student.context().close();
    }
  });

  test(`keeps a numeric student name inside the map tooltip and data table in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const studentName = "9".repeat(widestClassNames.studentName.length);
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      { locale, ...widestClassNames, studentName },
    );
    const plain = await newDevice(browser, locale, {
      javaScriptEnabled: false,
      sessionFrom: page,
    });
    try {
      for (const screen of [page, plain]) {
        await screen.goto(classPath);
        await screen.getByText(texts[locale].table, { exact: true }).click();
        expect(await layoutProblems(screen)).toEqual([]);
      }
      storeClassMapHolding(classId);
      for (const screen of [page, plain]) {
        await screen.goto(classPath);
        if (screen === page) {
          const map = screen.getByRole("slider", { name: texts[locale].title });
          await map.focus();
          await screen.keyboard.press("Home");
          await expect(
            screen
              .locator("main p")
              .filter({ hasText: new RegExp(`^${studentName}$`) }),
          ).toBeVisible();
          expect(await layoutProblems(screen)).toEqual([]);
          await screen.keyboard.press("Escape");
        }
        await screen.getByText(texts[locale].table, { exact: true }).click();
        await expect(
          screen
            .locator("main table")
            .getByRole("link", { name: studentName, exact: true }),
        ).toBeVisible();
        expect(await layoutProblems(screen)).toEqual([]);
      }
    } finally {
      await plain.context().close();
      await student.context().close();
    }
  });

  test(`keeps fixed map labels clear of a crowded class at every reference width, with and without JavaScript, in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      { locale, ...widestClassNames },
    );
    storeClassMapHolding(classId);
    const studentCount = 12;
    await fillClassMap(classId, { studentCount, now: classMapJoinedAt });
    const plain = await newDevice(browser, locale, {
      javaScriptEnabled: false,
      sessionFrom: page,
    });
    try {
      for (const screen of [page, plain]) {
        for (const { width, axis, colorScheme } of labelScenarios) {
          await screen.emulateMedia({ colorScheme });
          await screen.goto(`${classPath}?axis=${axis}`);
          await screen.setViewportSize({ width, height: 1000 });
          const drawing = screen.locator("main svg:has([data-map-label])");
          await expect(drawing.locator("circle")).toHaveCount(studentCount);
          await expect(
            drawing
              .locator('[data-map-label="fixed"]')
              .filter({ hasText: texts[locale].startingCash }),
          ).toBeVisible();
          await expectMapLabelsClear(drawing);
          expect(await layoutProblems(screen)).toEqual([]);
        }
      }
    } finally {
      await plain.context().close();
      await student.context().close();
    }
  });

  test(`keeps the join details open and enables copying when JavaScript loads in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const text = texts[locale];
    const { student, classPath } = await studentOfNewClass(page, browser, {
      locale,
      ...widestClassNames,
    });
    await holdClientScripts(
      page,
      { otherDevice: student.context() },
      async (loadClient) => {
        await page
          .context()
          .grantPermissions(["clipboard-read", "clipboard-write"]);
        const chip = page.locator("[data-join-code]:visible");
        await expect(chip).toHaveCount(1);
        const code = await chip.getAttribute("data-join-code");
        if (code === null) throw new Error("The workspace has no join code.");
        await expect(chip).toHaveAccessibleName(
          `${text.viewChip[0]}${code}${text.viewChip[1]}`,
        );
        const card = await openJoinDetails(page);
        await expect(card).toBeVisible();
        await expect(
          card.getByRole("button", { name: text.copy, exact: true }),
        ).toHaveCount(0);
        const details = await card.locator("dl").innerText();
        await loadClient();
        await expect(
          page.locator("[data-join-code]:visible"),
        ).toHaveAccessibleName(`${text.chip[0]}${code}${text.chip[1]}`);
        await expect(card).toBeVisible();
        expect(await card.locator("dl").innerText()).toBe(details);
        await expect(page).toHaveURL(classPath);
        await card
          .getByRole("button", { name: text.copy, exact: true })
          .click();
        await expect(card.getByRole("status")).toHaveText(
          `${text.copied[0]}${code}${text.copied[1]}`,
        );
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
          code,
        );
      },
    );
  });

  test(`explores the class on either risk axis, opens a student, and shares its code in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const text = texts[locale];
    let documentRequests = 0;
    page.on("request", (request) => {
      if (request.isNavigationRequest()) documentRequests += 1;
    });
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      { locale, ...widestClassNames },
    );
    storeClassMapHolding(classId);
    await page.goto(classPath);
    const map = page.getByRole("slider", { name: text.title });
    await expect(map).toBeVisible();
    await map.focus();
    await page.keyboard.press("Home");
    await expect(map).toHaveAttribute(
      "aria-valuetext",
      new RegExp(widestClassNames.studentName),
    );
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: text.deviation, exact: true }).click();
    await expect(page).toHaveURL(`${classPath}?axis=deviation`);
    await expect(
      page.locator("main svg text").filter({ hasText: text.axis }),
    ).toBeVisible();
    expect(await layoutProblems(page)).toEqual([]);
    await map.focus();
    await page.keyboard.press("Home");
    const documentsBeforeKey = documentRequests;
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/students\/\d+\?returnTo=/);
    expect(documentRequests).toBe(documentsBeforeKey);
    await page
      .getByRole("link", {
        name: text.back,
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(`${classPath}?axis=deviation`);
    await page.goto(classPath);
    await expect(map).toBeVisible();
    const point = await page.locator("main svg circle").first().boundingBox();
    if (point === null) throw new Error("The class map has no student mark.");
    const center = {
      x: point.x + point.width / 2,
      y: point.y + point.height / 2,
    };
    const documentsBeforePointer = documentRequests;
    if (test.info().project.use.hasTouch === true) {
      await page.touchscreen.tap(center.x, center.y);
    } else {
      await page.mouse.click(center.x, center.y);
    }
    await expect(page).toHaveURL(/\/students\/\d+\?returnTo=/);
    expect(documentRequests).toBe(documentsBeforePointer);
    await page.goto(classPath);
    await page.getByRole("button", { name: text.help, exact: true }).click();
    const help = page.getByRole("dialog", { name: text.title });
    await expect(help).toBeVisible();
    await expect(help.getByText(text.title, { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByText(text.table, { exact: true }).click();
    const studentLink = page
      .locator("main table")
      .getByRole("link", { name: widestClassNames.studentName });
    await expect(studentLink).toBeVisible();
    expect(await layoutProblems(page)).toEqual([]);
    await expectAccessibleScreen(page);
    await studentLink.click();
    await expect(page).toHaveURL(/\/students\/\d+\?returnTo=/);
    await page.goto(classPath);
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
    await openJoinDetails(page);
    const code = await page
      .locator("[data-join-code]:visible")
      .getAttribute("data-join-code");
    expect(code).not.toBeNull();
    if (code === null) throw new Error("The workspace has no join code.");
    await expect(page.locator("[data-join-code]:visible")).toHaveAccessibleName(
      `${text.chip[0]}${code}${text.chip[1]}`,
    );
    await expect(page.getByRole("dialog", { name: text.join })).toBeVisible();
    await expect(
      page.getByRole("button", { name: text.copy, exact: true }),
    ).toBeVisible();
    await expect(
      page.locator("[popover]:popover-open [role=status]"),
    ).toHaveText(`${text.copied[0]}${code}${text.copied[1]}`);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      code,
    );
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () =>
            Promise.reject(new Error("Copy refused by the browser")),
        },
      });
    });
    await page.reload();
    await openJoinDetails(page);
    await expect(
      page.locator("[popover]:popover-open [role=status]"),
    ).toHaveText(text.failed);
    await expectAccessibleScreen(page);

    const plain = await newDevice(browser, locale, {
      javaScriptEnabled: false,
      sessionFrom: page,
    });
    await plain.goto(classPath);
    await expect(
      plain.locator("[data-join-code]:visible"),
    ).toHaveAccessibleName(`${text.viewChip[0]}${code}${text.viewChip[1]}`);
    await expect(
      plain
        .locator('main svg rect:not([height="0em"]):not([width="0em"])')
        .first(),
    ).toBeVisible();
    await expect(plain.getByRole("slider")).toHaveCount(0);
    await plain
      .getByRole("link", { name: text.deviation, exact: true })
      .click();
    await expect(plain).toHaveURL(`${classPath}?axis=deviation`);
    await openJoinDetails(plain);
    await expect(plain.getByRole("dialog", { name: text.join })).toBeVisible();
    await expect(
      plain.getByRole("button", { name: text.copy, exact: true }),
    ).toHaveCount(0);
    await plain.context().close();
    await student.context().close();
  });
}

function storeClassMapHolding(classId: ClassId): void {
  storeTestHolding(classId, bbcaHolding);
  writeForTestStudent(classId, (database, membershipId) => {
    storeTestJoiningTime(database, membershipId, classMapJoinedAt);
  });
}

async function expectClassReturn(
  page: Page,
  control: Locator,
  { section, targetId }: { section: ClassMapSection; targetId: string | null },
): Promise<void> {
  if (targetId === null)
    throw new Error("The source control has no return target.");
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("axis") === sourceAxis &&
      url.searchParams.get("reveal") === section &&
      url.hash === `#${targetId}`,
  );
  await expect(page.locator(`#class-${section}`)).toHaveAttribute("open", "");
  await expect(control).toBeInViewport();
}
