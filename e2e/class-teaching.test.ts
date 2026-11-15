import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { startingCashLimits } from "../app/features/classes/class-rules.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { fillClassMap } from "./fill-class-map.ts";
import { storeTestJoiningTime } from "./store-test-joining-time.ts";
import { expect, test, type Page } from "@playwright/test";
import { eq } from "drizzle-orm";
import { classes } from "../app/features/classes/classes.schema.ts";
import { orders, portfolios } from "../app/features/trading/trading.schema.ts";
import { reasonMaximumLength } from "../app/features/trading/reason-maximum-length.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { addDays } from "../app/calendar-dates.ts";
import { wibDateOf } from "../app/wib.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import {
  storeActivityOrders,
  widenActivityReasons,
} from "./store-activity-orders.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";
import { newDevice } from "./new-device.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { widestClassNames } from "./widest-class-names.ts";
import { returnFromLesson } from "./return-from-lesson.ts";

const texts: Record<
  Locale,
  {
    flags: string;
    discussion: string;
    reasons: string;
    all: string;
    close: string;
    lesson: string;
    lessonTitle: string;
    closeLesson: string;
    fullLesson: string;
    back: string;
    students: string;
  }
> = {
  id: {
    flags: "Perlu perhatian",
    discussion: "Bahan diskusi",
    reasons: "Alasan terbaru",
    all: "Semua",
    close: "Tutup alasan",
    lesson: "Buka materi sesi 9",
    lessonTitle: "CAPM dan garis pasar sekuritas",
    closeLesson: "Tutup",
    fullLesson: "Buka di Belajar",
    back: "Kembali ke halaman sebelumnya",
    students: "Mahasiswa",
  },
  en: {
    flags: "Needs attention",
    discussion: "Discussion questions",
    reasons: "Latest reasons",
    all: "All",
    close: "Close reasons",
    lesson: "Open session 9 lesson",
    lessonTitle: "CAPM and the security market line",
    closeLesson: "Close",
    fullLesson: "Open in Learn",
    back: "Back to the previous page",
    students: "Students",
  },
};

for (const locale of locales) {
  test(`opens flagged students, the session lesson, and all reasons before and after scripts load in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const text = texts[locale];
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      { locale, ...widestClassNames },
    );
    const plain = await newDevice(browser, locale, {
      javaScriptEnabled: false,
      sessionFrom: page,
    });
    try {
      storeClassReasons(classId);
      await fillClassMap(classId, {
        studentCount: 2,
        now: new Date("2026-10-26T03:00:00Z"),
      });
      for (const screen of [page, plain]) {
        await screen.goto(classPath);
        const flags = screen.getByRole("region", { name: text.flags });
        await flags.locator('a[href*="filter=inactive"]').click();
        await expect(screen).toHaveURL(/\/students\?filter=inactive$/);
        await expect(
          screen.getByRole("heading", { name: text.students, exact: true }),
        ).toBeVisible();
        await screen.goto(classPath);
        await flags.getByRole("link").first().click();
        await expect(screen).toHaveURL(/\/students\?student=\d+/);
        await expect(screen.getByRole("dialog")).toBeVisible();
        await screen.goto(`${classPath}?axis=deviation`);
        const lesson = screen.getByRole("link", {
          name: text.lesson,
          exact: true,
        });
        if (screen === page) {
          await checkDiscussionSheet(screen, text);
          await lesson.click();
          await screen
            .getByRole("dialog", { name: text.lessonTitle, exact: true })
            .getByRole("link", { name: text.fullLesson, exact: true })
            .click({ noWaitAfter: true });
        } else await lesson.click({ noWaitAfter: true });
        await returnToDiscussion(screen, text, classPath);
        await expect(
          screen.getByRole("region", { name: text.reasons }).getByRole("link"),
        ).toHaveCount(2);
        await screen
          .getByRole("button", { name: text.all, exact: true })
          .click();
        const sheet = screen.getByRole("dialog", { name: text.reasons });
        await expect(sheet.getByRole("link")).toHaveCount(3);
        await expect(
          sheet.getByText("Third reason", { exact: true }),
        ).toBeVisible();
        if (screen === page) await expectAccessibleScreen(screen);
        await sheet.getByRole("button", { name: text.close }).click();
        await expect(sheet).not.toBeVisible();
        await expect(
          screen.getByRole("button", { name: text.all, exact: true }),
        ).toBeFocused();
        await screen
          .getByRole("region", { name: text.reasons })
          .getByRole("link")
          .first()
          .click();
        await expect(screen.locator("#student-reasons")).toBeInViewport();
        await screen
          .locator(`main a[href="${classPath}?axis=deviation#class-reasons"]`)
          .click();
        await expect(screen).toHaveURL(
          `${classPath}?axis=deviation#class-reasons`,
        );
        await expect(
          screen.getByRole("button", { name: text.all, exact: true }),
        ).toBeInViewport({ ratio: 1 });
        expect(await layoutProblems(screen)).toEqual([]);
      }
      await student.goto(classPath);
      await expect(
        student.getByRole("heading", { name: text.flags }),
      ).toHaveCount(0);
      await holdClientScripts(
        page,
        { otherDevice: student.context() },
        async (loadClient) => {
          await page
            .getByRole("button", { name: text.all, exact: true })
            .click();
          const sheet = page.getByRole("dialog", { name: text.reasons });
          await expect(sheet).toBeVisible();
          await loadClient();
          await expect(sheet).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(sheet).not.toBeVisible();
        },
      );
      await holdClientScripts(page, {}, async (loadClient) => {
        await page
          .getByRole("link", { name: text.lesson, exact: true })
          .click({ noWaitAfter: true });
        await returnToDiscussion(page, text, classPath);
        await loadClient();
        await expect(page.getByRole("slider")).toBeVisible();
        await checkDiscussionSheet(page, text);
      });
      for (const reason of ["W", "9"]) {
        widenActivityReasons(classId, reason.repeat(reasonMaximumLength));
        await page.goto(classPath);
        await page.getByRole("button", { name: text.all, exact: true }).click();
        expect(await layoutProblems(page)).toEqual([]);
        await page.keyboard.press("Escape");
        expect(await layoutProblems(page)).toEqual([]);
      }
    } finally {
      await plain.context().close();
      await student.context().close();
    }
  });

  test(`captures the teaching cards beside their Peta references in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "phone",
      "The phone project supplies touch for the reference walk.",
    );
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      {
        locale,
        className: "Manajemen Portofolio A",
        lecturerName: "Dosen Kelas",
        studentName: "Sari Wulandari",
      },
    );
    try {
      storeClassReasons(classId);
      const joinedAt = new Date("2026-10-26T03:00:00Z");
      await fillClassMap(classId, { studentCount: 12, now: joinedAt });
      writeForTestStudent(classId, (database, membershipId) => {
        storeTestJoiningTime(database, membershipId, joinedAt);
        database
          .update(portfolios)
          .set({ cash: rupiah(startingCashLimits.maximum * 0.99) })
          .where(eq(portfolios.membershipId, membershipId))
          .run();
        database
          .update(classes)
          .set({ firstSessionDate: addDays(wibDateOf(new Date()), -9 * 7) })
          .where(eq(classes.id, classId))
          .run();
      });
      for (const colorScheme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme });
        for (const width of [360, 1440, 1920]) {
          await page.setViewportSize({ width, height: 932 });
          await page.goto(classPath);
          await expect(
            page.getByRole("heading", {
              name: texts[locale].discussion,
              exact: false,
            }),
          ).toBeVisible();
          expect(await layoutProblems(page)).toEqual([]);
          await page.screenshot({
            path: testInfo.outputPath(
              `${locale}-${colorScheme}-${String(width)}-class.png`,
            ),
            fullPage: true,
            scale: "css",
          });
        }
      }
    } finally {
      await student.context().close();
    }
  });
}

async function returnToDiscussion(
  page: Page,
  text: (typeof texts)[Locale],
  classPath: string,
): Promise<void> {
  const source = page.getByRole("link", { name: text.lesson, exact: true });
  await returnFromLesson(page, {
    lesson: text.lessonTitle,
    back: text.back,
    address: `${classPath}?axis=deviation#class-discussion`,
    source,
  });
  await expect(source).toBeInViewport({ ratio: 1 });
}

async function checkDiscussionSheet(
  page: Page,
  text: (typeof texts)[Locale],
): Promise<void> {
  const source = page.getByRole("link", { name: text.lesson, exact: true });
  await source.scrollIntoViewIfNeeded();
  const address = page.url();
  const position = await page.evaluate(() => window.scrollY);
  await source.click();
  const sheet = page.getByRole("dialog", {
    name: text.lessonTitle,
    exact: true,
  });
  await expect(sheet).toBeVisible();
  await expect(page).toHaveURL(address);
  await sheet
    .getByRole("button", { name: text.closeLesson, exact: true })
    .click();
  await expect(sheet).toHaveCount(0);
  await expect(source).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(position);
}

function storeClassReasons(classId: ClassId): void {
  storeActivityOrders(classId);
  writeForTestStudent(classId, (database, membershipId) => {
    const reason = database
      .select()
      .from(orders)
      .where(eq(orders.membershipId, membershipId))
      .get();
    if (reason === undefined)
      throw new Error("The test has no reasoned order.");
    database
      .insert(orders)
      .values([
        { ...reason, id: undefined, reason: "Second reason" },
        { ...reason, id: undefined, reason: "Third reason" },
      ])
      .run();
  });
}
