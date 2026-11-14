import { languageNames } from "../app/language-names.ts";
import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { memberships } from "../app/features/classes/classes.schema.ts";
import { locales } from "../app/paraglide/runtime.js";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { isPhone } from "./frame.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";

for (const locale of locales) {
  test(`keeps Beranda inside the frame at reference widths in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classId } = await studentOfNewClass(page, browser, {
      locale,
      className: "Manajemen Portofolio A",
      lecturerName: "Dosen",
      studentName: "Mahasiswa",
      // Decimal adds the independently computed costs and cash below to Rp42,042,560, so the picture uses their scale. The layout walk separately checks the largest starting cash.
      startingCash: rupiah(42_042_560),
    });
    // The values and costs are the recorded quotes and independently computed fixture of measures-for-test.server.ts, which home-portfolio.test.tsx checks on this screen. As storeTestHolding explains, no fixture quote can fill an order, so the holdings are stored without orders.
    storeTestHolding(
      classId,
      {
        code: "BBCA",
        shares: shares(5_500),
        cost: rupiah(27_431_085),
        cash: rupiah(10_956_000),
      },
      [{ code: "AMMN", shares: shares(1_000), cost: rupiah(3_655_475) }],
    );
    writeForTestStudent(classId, (database, membershipId) => {
      database
        .update(memberships)
        .set({ joinedAt: new Date("2026-10-26T10:00:00Z") })
        .where(eq(memberships.id, membershipId))
        .run();
    });
    await student.reload();
    await expectAccessibleScreen(student);
    for (const width of isPhone() ? [360] : [1440, 1920]) {
      await student.setViewportSize({ width, height: 900 });
      for (const colorScheme of ["light", "dark"] as const) {
        await student.emulateMedia({ colorScheme });
        expect(await layoutProblems(student)).toEqual([]);
        await student.screenshot({
          path: test
            .info()
            .outputPath(`home-${locale}-${String(width)}-${colorScheme}.png`),
          fullPage: true,
          scale: "css",
        });
      }
    }
    await student.context().close();
  });
}
