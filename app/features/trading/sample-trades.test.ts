import { expect, test } from "vitest";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { locales } from "~/paraglide/runtime.js";
import { languageNames } from "~/language-names";
import { rupiah } from "~/units/rupiah";
import { sampleOrderFailureText } from "./sample-order-failure-text";
import { buildSampleTrade } from "./sample-trades";
import {
  accountForTest,
  bbcaForTest,
  limitForTest,
  purchaseForTest,
  saleForTest,
} from "./orders-for-test";
import type { OrderRequest } from "./order";
import type { AccountState } from "./place-order";

// Python Decimal with ROUND_HALF_UP gives the expected purchase cost and affordable lot count from the recorded lot size, price, and broker rate, independently of the engine.
const cases: {
  name: string;
  request: OrderRequest;
  account: AccountState;
  text: string;
}[] = [
  {
    name: "an off-tick limit",
    request: purchaseForTest({ price: limitForTest(4_981) }),
    account: accountForTest(),
    text: "The sample buy order of BBCA at 2026-11-02T03:00:00.000Z with limit IDR\u00a04,981 failed the engine check. The price must follow a tick size of IDR\u00a010. Choose IDR\u00a04,980 or IDR\u00a04,990 instead.",
  },
  {
    name: "a purchase beyond its cash",
    request: purchaseForTest(),
    account: accountForTest({ cash: rupiah(500_000) }),
    text: "The sample buy order of BBCA at 2026-11-02T03:00:00.000Z with market quote IDR\u00a04,980 failed the engine check. The purchase of BBCA costs IDR\u00a02,493,735, including costs, but available cash is IDR\u00a0500,000. Open purchases set aside IDR\u00a00. The largest affordable lot count at IDR\u00a04,980 is 1. Reduce or remove this purchase from the recipe.",
  },
  {
    name: "a sale without a holding",
    request: saleForTest(),
    account: accountForTest(),
    text: "The sample sell order of BBCA at 2026-11-02T03:00:00.000Z with market quote IDR\u00a04,980 failed the engine check. The sale of BBCA requests a lot count of 5, but the holding has 0 and open sales set aside 0. Remove this sale or reduce its lot count to the unreserved holding.",
  },
];

for (const locale of locales) {
  for (const item of cases) {
    test(`explains ${item.name} in English while the app uses ${languageNames[locale]}`, () => {
      switchLocaleForTest(locale);
      expect(buildSampleTrade(item.request, item.account, bbcaForTest)).toEqual(
        {
          ok: false,
          failure: item.text,
        },
      );
    });
  }

  test(`keeps operator dates in English while the app uses ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(
      sampleOrderFailureText({
        kind: "outsideUniverse",
        code: "BREN",
        date: "2026-11-02",
      }),
    ).toBe(
      "BREN is outside the LQ45 on November 2, 2026. Choose a stock in the recorded universe for that day.",
    );
  });
}

test("keeps the source's missing-record reason", () => {
  const reason =
    "No recorded IDX rule covers 2027-01-04, so add that day to idx-calendar.json.";
  for (const kind of [
    "missingRules",
    "missingCosts",
    "missingUniverse",
  ] as const) {
    expect(sampleOrderFailureText({ kind, reason })).toBe(reason);
  }
});
