import type { Page, Browser } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { studentWithPortfolio } from "./student-with-portfolio.ts";

export async function tradeImpactStudent(
  page: Page,
  browser: Browser,
  {
    locale,
    kind,
  }: { locale: Locale; kind: "diversified" | "lastHolding" | "unmeasured" },
) {
  const fixtures: Record<typeof kind, Parameters<typeof storeTestHolding>[1]> =
    {
      diversified: {
        code: "BBCA",
        shares: shares(5_500),
        cost: rupiah(27_431_085),
        cash: rupiah(10_956_000),
      },
      lastHolding: {
        code: "BBCA",
        shares: shares(1_000),
        cost: rupiah(4_987_470),
        cash: rupiah(10_000_000),
      },
      unmeasured: {
        code: "AADI",
        shares: shares(1_000),
        cost: rupiah(11_492_213),
        cash: rupiah(10_000_000),
      },
    };
  const held = fixtures[kind];
  return studentWithPortfolio(page, browser, {
    locale,
    givePortfolio: (classId) => {
      storeTestHolding(
        classId,
        held,
        kind === "diversified"
          ? [{ code: "TLKM", shares: shares(8_300), cost: rupiah(16_458_651) }]
          : [],
      );
    },
  });
}
