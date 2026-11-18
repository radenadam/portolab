import { stockPath } from "~/features/market-data/stock-path";
import { expect, test } from "vitest";
import { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { priceSourceContext } from "~/features/market-data/price-source-context.server";
import type { ClassId } from "~/features/classes/classes.schema";
import { formDataForTest } from "~/form-data-for-test";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import { saveDailyHistory } from "~/features/market-data/history-store.server";
import { stockClosesForTest } from "~/features/market-data/history-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { parseRecordId } from "~/value-parsers";
import { placeFromForm } from "./order-actions.server";
import { bbcaCloseOfFridayForTest } from "./orders-for-test";
import {
  studentWithQuotesForTest,
  storeHoldingsForTest,
} from "./portfolios-for-test.server";

// Python Decimal with ROUND_HALF_UP gives each total for five lots at the correction price. The holding cost is 3000 * 4940 plus the fee of 22230, leaving 85157770 of the original cash.
const ranges = {
  monday: {
    lowest: 4640,
    highest: 6225,
    buy: ["2323480", "3117169"],
    sell: ["2314200", "3104718"],
  },
  friday: {
    lowest: 4770,
    highest: 6150,
    buy: ["2388578", "3079613"],
    sell: ["2379037", "3067312"],
  },
  nextMonday: {
    lowest: 4840,
    highest: 6225,
    buy: ["2423630", "3117169"],
    sell: ["2413950", "3104718"],
  },
};

for (const locale of locales) {
  for (const [moment, range] of [
    ["2026-11-02T01:50:00Z", ranges.monday],
    ["2026-11-02T03:00:00Z", ranges.monday],
    ["2026-11-02T05:00:00Z", ranges.monday],
    ["2026-11-06T05:00:00Z", ranges.friday],
    ["2026-11-06T09:00:00Z", ranges.nextMonday],
  ] as const) {
    for (const side of ["buy", "sell"] as const) {
      test(`offers accepted tick and band corrections for a ${side} at ${moment} in ${languageNames[locale]}`, async () => {
        switchLocaleForTest(locale);
        const now = new Date(moment);
        const { database, owner } = await studentWithQuotesForTest(
          [bbcaCloseOfFridayForTest],
          now,
        );
        // The closes of BBCA.JK that Yahoo Finance returned on 15 November 2026 keep each Friday reference final for its own day.
        saveDailyHistory(
          database,
          stockClosesForTest("BBCA", [
            ["2026-11-05", 5125],
            ["2026-11-06", 5200],
          ]),
        );
        storeHoldingsForTest(database, owner, {
          cash: rupiah(85_157_770),
          holdings: [
            { code: "BBCA", shares: shares(3000), cost: rupiah(14_842_230) },
          ],
        });
        const classId = successValueForTest(
          parseRecordId<ClassId>("1", "classId"),
          "The class id is valid",
        );
        const context = new RouterContextProvider();
        context.set(databaseContext, database);
        context.set(priceSourceContext, fixturePriceSource);
        const submit = (limit: string, seenTotal: string) =>
          placeFromForm(context, {
            form: formDataForTest({
              priceKind: "limit",
              lots: "5",
              limit,
              seenTotal,
            }),
            code: "BBCA",
            side,
            place: { classId, owner },
            ticketPath: stockPath(classId, "BBCA", side),
            now,
          });
        const cases = [
          {
            written: String(range.lowest - 1),
            steps: [range.lowest],
            buy: [range.buy[0]],
            sell: [range.sell[0]],
          },
          {
            written: String(range.highest + 1),
            steps: [range.highest],
            buy: [range.buy[1]],
            sell: [range.sell[1]],
          },
          {
            written: "90000000000000",
            steps: [range.highest],
            buy: [range.buy[1]],
            sell: [range.sell[1]],
          },
          {
            written: "5001",
            steps: [5000, 5025],
            buy: ["2503750", "2516269"],
            sell: ["2493750", "2506218"],
          },
        ];
        for (const entry of cases) {
          expect(submit(entry.written, "0")).toMatchObject({
            data: { limitSteps: entry.steps },
            init: { status: 400 },
          });
          for (const [index, price] of entry.steps.entries()) {
            const total = entry[side][index];
            if (total === undefined)
              throw new Error("Every correction has an independent total.");
            expect(submit(String(price), total)).toBeInstanceOf(Response);
          }
        }
      });
    }
  }
}
