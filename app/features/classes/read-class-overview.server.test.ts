import { expect, test } from "vitest";
import { listStudents } from "./class-store.server";
import { classOfStudentsForTest } from "~/features/grading/class-of-students-for-test.server";
import { placedOrderForTest } from "~/features/trading/portfolios-for-test.server";
import { purchaseForTest } from "~/features/trading/orders-for-test";
import type { Locale } from "~/paraglide/runtime.js";
import { locales } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { readClassOverview } from "./read-class-overview.server";

const texts: Record<Locale, { none: string; latest: string; price: string }> = {
  id: {
    none: "Belum pernah memasang order",
    latest: "2 Nov 2026, 10.00",
    price: "BBCA 30 Okt 2026, 16.14",
  },
  en: {
    none: "No order placed yet",
    latest: "Nov 2, 2026, 10:00 AM",
    price: "BBCA Oct 30, 2026, 4:14 PM",
  },
};

for (const locale of locales) {
  test(`counts orders in the WIB week and uses the latest order as activity, while keeping every unmeasured student in ${locale}`, async () => {
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
    const request = new Request("http://localhost/");
    const overview = readClassOverview(database, taughtClass, {
      request,
      now: new Date("2026-11-02T03:01:00Z"),
      delayMinutes: 10,
    });
    expect(overview.students).toHaveLength(6);
    expect(overview.active).toBe(1);
    expect(overview.ordersThisWeek).toBe(1);
    expect(overview.students[1]?.lastOrder).toBe(texts[locale].latest);
    expect(overview.students[0]?.lastOrder).toBe(texts[locale].none);
    expect(overview.students[1]?.priceTimes).toContain(texts[locale].price);
    expect(
      overview.students.filter(({ risk }) => risk !== undefined),
    ).toHaveLength(3);
    expect(overview.students[4]?.return).toBeUndefined();
    const nextWeek = readClassOverview(database, taughtClass, {
      request,
      now: new Date("2026-11-08T17:00:00Z"),
      delayMinutes: 10,
    });
    expect(nextWeek.active).toBe(0);
    expect(nextWeek.ordersThisWeek).toBe(0);
    expect(nextWeek.students[1]?.lastOrder).toBe(texts[locale].latest);
  });
}
