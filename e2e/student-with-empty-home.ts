import type { Browser, Page } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";
import type { Rupiah } from "../app/units/rupiah.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";
import { storeTestJoiningTime } from "./store-test-joining-time.ts";

export async function studentWithEmptyHome(
  page: Page,
  browser: Browser,
  {
    locale,
    names,
    startingCash = rupiah(125_000_000),
  }: {
    locale: Locale;
    names?: { className: string; lecturerName: string; studentName: string };
    startingCash?: Rupiah;
  },
) {
  const prepared = await studentOfNewClass(page, browser, {
    locale,
    className: names?.className ?? "Manajemen Portofolio A",
    lecturerName: names?.lecturerName ?? "Dosen",
    studentName: names?.studentName ?? "Teguh Awan",
    startingCash,
  });
  writeForTestStudent(prepared.classId, (database, membershipId) => {
    storeTestJoiningTime(
      database,
      membershipId,
      new Date("2026-10-26T10:00:00Z"),
    );
  });
  await prepared.student.reload();
  return prepared;
}
