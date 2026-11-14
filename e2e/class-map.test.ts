import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { memberships } from "../app/features/classes/classes.schema.ts";
import type { Locale } from "../app/paraglide/runtime.js";
import { locales } from "../app/paraglide/runtime.js";
import { bbcaHolding } from "./bbca-holding.ts";
import { openJoinDetails } from "./class-controls.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { newDevice } from "./new-device.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";
import { withHeldClientScripts } from "./with-held-client-scripts.ts";

const texts: Record<
  Locale,
  {
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
  }
> = {
  id: {
    title: "Peta risiko dan imbal hasil",
    deviation: "Simpangan baku",
    axis: "Simpangan baku per bulan",
    table: "Lihat data mahasiswa dan waktu harga",
    help: "Tentang peta kelas",
    join: "Kode gabung",
    copied: ["Kode ", " tersalin."],
    failed: "Browser menolak menyalin otomatis. Pilih kode lalu salin.",
    copy: "Salin kode",
    chip: ["Kode gabung ", ". Salin kode dan lihat alamat gabung"],
    viewChip: ["Kode gabung ", ". Lihat kode dan alamat gabung"],
  },
  en: {
    title: "Risk and return map",
    deviation: "Standard deviation",
    axis: "Standard deviation per month",
    table: "View student data and price times",
    help: "About the class map",
    join: "Join code",
    copied: ["Code ", " copied."],
    failed:
      "The browser refused automatic copying. Select the code and copy it.",
    copy: "Copy code",
    chip: ["Join code ", ". Copy the code and view join addresses"],
    viewChip: ["Join code ", ". View the code and join addresses"],
  },
};

for (const locale of locales) {
  test(`keeps the join details open and enables copying when JavaScript loads in ${locale}`, async ({
    page,
    browser,
  }) => {
    const text = texts[locale];
    const { student, classPath } = await studentOfNewClass(page, browser, {
      locale,
      ...widestClassNames,
    });
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
    try {
      await withHeldClientScripts(
        page,
        async () => {
          const chip = page.locator("[data-join-code]:visible");
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
          return { card, code, details: await card.locator("dl").innerText() };
        },
        async ({ card, code, details }) => {
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
          expect(
            await page.evaluate(() => navigator.clipboard.readText()),
          ).toBe(code);
        },
      );
    } finally {
      await student.context().close();
    }
  });

  test(`explores the class on either risk axis, opens a student, and shares its code in ${locale}`, async ({
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
    storeTestHolding(classId, bbcaHolding);
    writeForTestStudent(classId, (database, membershipId) => {
      database
        .update(memberships)
        .set({ joinedAt: new Date("2026-10-26T03:00:00Z") })
        .where(eq(memberships.id, membershipId))
        .run();
    });
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
    await page.goBack();
    await expect(page).toHaveURL(classPath);
    await map.focus();
    await page.keyboard.press("Home");
    const documentsBeforeKey = documentRequests;
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/students\/\d+\/portfolio$/);
    expect(documentRequests).toBe(documentsBeforeKey);
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
    await expect(page).toHaveURL(/\/students\/\d+\/portfolio$/);
    expect(documentRequests).toBe(documentsBeforePointer);
    await page.goto(classPath);
    await page.getByRole("button", { name: text.help, exact: true }).click();
    await expect(page.getByRole("dialog", { name: text.help })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByText(text.table, { exact: true }).click();
    const studentLink = page
      .locator("main table")
      .getByRole("link", { name: widestClassNames.studentName });
    await expect(studentLink).toBeVisible();
    expect(await layoutProblems(page)).toEqual([]);
    await expectAccessibleScreen(page);
    await studentLink.click();
    await expect(page).toHaveURL(/\/students\/\d+\/portfolio$/);
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
      storageState: await page.context().storageState(),
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
