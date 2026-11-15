import { expect, test } from "vitest";
import { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { priceSourceContext } from "~/features/market-data/price-source-context.server";
import { formDataForTest } from "~/form-data-for-test";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { parseRecordId } from "~/value-parsers";
import type { ClassId } from "~/features/classes/classes.schema";
import { placeFromForm } from "./order-actions.server";
import {
  bbcaCloseOfFridayForTest,
  purchaseForTest,
  saleForTest,
  orderLotsForTest,
} from "./orders-for-test";
import {
  placedOrderForTest,
  studentWithQuotesForTest,
  storeHoldingsForTest,
} from "./portfolios-for-test.server";
import { readPortfolio } from "./portfolio-store.server";
import { readTicket } from "./read-ticket.server";

// Python Decimal with ROUND_HALF_UP gives 498747 for one bought lot, 1994988 for four bought lots, and 1987020 for four sold lots at Rp4980. The previous Friday's quote remains the latest quote, so each accepted order waits in every schedule state.
const moments = [
  "2026-11-02T03:00:00Z",
  "2026-11-02T05:00:00Z",
  "2026-11-06T05:00:00Z",
  "2026-11-06T09:00:00Z",
];

for (const locale of locales) {
  for (const moment of moments) {
    for (const side of ["buy", "sell"] as const) {
      test(`takes the ${side} correction at its boundary and refuses the next lot at ${moment} in ${languageNames[locale]}`, async () => {
        switchLocaleForTest(locale);
        const classId = successValueForTest(
          parseRecordId<ClassId>("1", "classId"),
          "The class id is valid",
        );
        const now = new Date(moment);
        const { database, owner } = await studentWithQuotesForTest(
          [bbcaCloseOfFridayForTest],
          now,
        );
        storeHoldingsForTest(database, owner, {
          cash: rupiah(2_500_000),
          holdings: [
            { code: "BBCA", shares: shares(500), cost: rupiah(2_473_705) },
          ],
        });
        const first = side === "buy" ? purchaseForTest : saleForTest;
        placedOrderForTest(
          database,
          owner,
          first({ lots: orderLotsForTest(1), placedAt: now }),
        );
        const ticket = readTicket(database, readPortfolio(database, owner), {
          code: "BBCA",
          now,
          delayMinutes: 10,
        });
        expect(ticket.available).toBe(side === "buy" ? 2_001_253 : 2_500_000);
        expect(ticket.free).toBe(side === "sell" ? 4 : 5);
        const context = new RouterContextProvider();
        context.set(databaseContext, database);
        context.set(priceSourceContext, fixturePriceSource);
        const submit = (lots: string, seenTotal: string) =>
          placeFromForm(context, {
            form: formDataForTest({
              lots,
              priceKind: "market",
              seenTotal,
            }),
            place: { classId, owner },
            code: "BBCA",
            side,
            ticketPath: `/classes/1/stocks/BBCA/${side}`,
            now,
          });
        expect(submit("5", "0")).toMatchObject({
          data: { rejection: { field: "lots", lotsStep: 4 } },
          init: { status: 400 },
        });
        expect(readPortfolio(database, owner).orders).toHaveLength(1);
        expect(
          submit("4", side === "buy" ? "1994988" : "1987020"),
        ).toBeInstanceOf(Response);
        expect(readPortfolio(database, owner).orders).toHaveLength(2);
      });
    }
  }
}
