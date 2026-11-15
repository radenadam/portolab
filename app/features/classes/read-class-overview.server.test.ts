import { ne } from "drizzle-orm";
import { memberships } from "./classes.schema";
import {
  sourceAnsweringForTest,
  updateQuotesForTest,
} from "~/features/market-data/quote-updates-for-test.server";
import { stockQuote } from "~/features/market-data/stock-quote";
import { languageNames } from "~/language-names";
import { expect, test } from "vitest";
import { listStudents } from "./class-store.server";
import { classOfStudentsForTest } from "~/features/grading/class-of-students-for-test.server";
import { placedOrderForTest } from "~/features/trading/portfolios-for-test.server";
import { purchaseForTest } from "~/features/trading/orders-for-test";
import type { Locale } from "~/paraglide/runtime.js";
import { locales } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { readClassOverview } from "./read-class-overview.server";

const texts: Record<
  Locale,
  {
    none: string;
    latest: string;
    price: string;
    pricesAt: string;
    pricesSame: string;
    pricesMixed: string;
  }
> = {
  id: {
    none: "Belum pernah memasang order",
    latest: "2 Nov 2026, 10.00",
    price: "BBCA",
    pricesSame: "BBCA dan TLKM",
    pricesMixed: "BBCA dan TLKM 30 Okt 2026, 16.15",
    pricesAt: "30 Okt 2026, 16.14 WIB",
  },
  en: {
    none: "No order placed yet",
    latest: "Nov 2, 2026, 10:00 AM",
    price: "BBCA",
    pricesSame: "BBCA and TLKM",
    pricesMixed: "BBCA and TLKM Oct 30, 2026, 4:15 PM",
    pricesAt: "Oct 30, 2026, 4:14 PM WIB",
  },
};

for (const locale of locales) {
  test(`counts orders in the WIB week and uses the latest order as activity, while keeping every unmeasured student in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { database, taughtClass } = await classOfStudentsForTest();
    const student = listStudents(database, taughtClass.id)[1];
    expect(student?.name).toBe("Eko Prasetyo");
    if (student === undefined) throw new Error("The fixture has no Eko.");
    placedOrderForTest(
      database,
      {
        membershipId: student.membershipId,
        startingCash: taughtClass.startingCash,
      },
      purchaseForTest(),
    );
    const overview = overviewAt(
      { database, taughtClass },
      new Date("2026-11-02T03:01:00Z"),
    );
    expect(overview.pricesAt).toBe(texts[locale].pricesAt);
    expect(overview.students).toHaveLength(6);
    expect(overview.active).toBe(1);
    expect(overview.ordersThisWeek).toBe(1);
    expect(overview.students[1]?.lastOrder).toBe(texts[locale].latest);
    expect(overview.students[0]?.lastOrder).toBe(texts[locale].none);
    expect(overview.students[1]?.priceTimes).toBe(texts[locale].price);
    expect(
      overview.students.filter(({ risk }) => risk !== undefined),
    ).toHaveLength(3);
    expect(overview.students[4]?.return).toBeUndefined();
    const nextWeek = overviewAt(
      { database, taughtClass },
      new Date("2026-11-08T17:00:00Z"),
    );
    expect(nextWeek.active).toBe(0);
    expect(nextWeek.ordersThisWeek).toBe(0);
    expect(nextWeek.students[1]?.lastOrder).toBe(texts[locale].latest);
  });

  test(`keeps only an exceptional quote time beside its code after a partial update in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const fixture = await classOfStudentsForTest();
    const now = new Date("2026-11-02T03:01:00Z");
    const before = overviewAt(fixture, now);
    expect(before.pricesAt).toBe(texts[locale].pricesAt);
    expect(before.students[0]?.name).toBe("Sari Wulandari");
    expect(before.students[0]?.priceTimes).toBe(texts[locale].pricesSame);
    // A different displayed minute makes this quote an exception to the shared note.
    await updateQuotesForTest(
      fixture.database,
      sourceAnsweringForTest([
        stockQuote("TLKM", [1980, 1980], "2026-10-30T09:15:51.000Z"),
      ]),
      { at: new Date("2026-10-30T09:16:00Z") },
    );
    const after = overviewAt(fixture, now);
    expect(after.pricesAt).toBe(texts[locale].pricesAt);
    expect(after.students[0]?.priceTimes).toBe(texts[locale].pricesMixed);
  });

  test(`keeps the latest time when deleted enrollments leave one quote and no time when none remain in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const fixture = await classOfStudentsForTest();
    const students = listStudents(fixture.database, fixture.taughtClass.id);
    expect(students).toHaveLength(6);
    const student = students[1];
    expect(student?.name).toBe("Eko Prasetyo");
    if (student === undefined) throw new Error("The fixture has no Eko.");
    fixture.database
      .delete(memberships)
      .where(ne(memberships.id, student.membershipId))
      .run();
    const now = new Date("2026-11-02T03:01:00Z");
    const remaining = overviewAt(fixture, now);
    expect(remaining.students).toHaveLength(1);
    expect(remaining.pricesAt).toBe(texts[locale].pricesAt);
    expect(remaining.students[0]?.priceTimes).toBe(texts[locale].price);
    fixture.database.delete(memberships).run();
    const empty = overviewAt(fixture, now);
    expect(empty.students).toEqual([]);
    expect(empty.pricesAt).toBeUndefined();
  });
}

function overviewAt(
  { database, taughtClass }: Awaited<ReturnType<typeof classOfStudentsForTest>>,
  now: Date,
): ReturnType<typeof readClassOverview> {
  return readClassOverview(database, taughtClass, {
    request: new Request("http://localhost/"),
    now,
    delayMinutes: 10,
  });
}
