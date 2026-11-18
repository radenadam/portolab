import { expect, test } from "vitest";
import {
  createTestStudent,
  readerContextForTest,
} from "~/features/accounts/accounts-for-test.server";
import { joinClass } from "~/features/classes/class-store.server";
import { createLecturerWithClassForTest } from "~/features/classes/classes-for-test.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { priceSourceContext } from "~/features/market-data/price-source-context.server";
import { readHomePortfolio } from "./read-home-portfolio.server";

test("opens a named introduction step and keeps an unknown step closed on the welcome", async () => {
  const database = openDatabaseForTest();
  const { classId } = await createLecturerWithClassForTest(database);
  const studentId = await createTestStudent(database, "teguh", "Teguh Awan");
  const now = new Date("2026-11-02T03:05:00Z");
  joinClass(database, { classId, studentId }, now);
  const context = readerContextForTest(database, { userId: studentId, now });
  context.set(priceSourceContext, fixturePriceSource);
  const read = (search: string) => {
    const url = new URL(`http://localhost/classes/${String(classId)}${search}`);
    return readHomePortfolio(context, {
      request: new Request(url),
      url,
      classId: String(classId),
      now,
      firstSessionDate: null,
    });
  };
  for (const [search, step] of [
    ["?welcome=help", "help"],
    ["?welcome=unknown", undefined],
    ["", undefined],
  ] as const) {
    const home = read(search);
    expect(home.welcome).toBeDefined();
    expect(home.onboarding).toBe(step);
  }
});
