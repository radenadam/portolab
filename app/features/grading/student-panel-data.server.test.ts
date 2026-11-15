import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { checkOrder } from "~/features/trading/check-order";
import {
  acceptedForTest,
  accountForTest,
  bbcaForTest,
  purchaseForTest,
} from "~/features/trading/orders-for-test";
import {
  readPortfolio,
  saveOrderState,
  savePlacedOrder,
} from "~/features/trading/portfolio-store.server";
import { studentPortfolioForTest } from "~/features/trading/portfolios-for-test.server";
import { shares } from "~/units/shares";
import { studentPanelData } from "./student-panel-data.server";

test("chooses the most recently filled written reason rather than the last placed order, and leaves out pending orders and blank reasons", async () => {
  const database = openDatabaseForTest();
  const owner = await studentPortfolioForTest(database);
  for (const [reason, placedAt, filledAt] of [
    [
      "The earlier order filled last",
      "2026-11-02T03:00:00Z",
      "2026-11-02T04:00:00Z",
    ],
    [
      "The later order filled first",
      "2026-11-02T03:01:00Z",
      "2026-11-02T03:20:00Z",
    ],
    ["Still waiting", "2026-11-02T03:02:00Z", undefined],
    [undefined, "2026-11-02T03:03:00Z", "2026-11-02T05:00:00Z"],
  ] as const) {
    const order = acceptedForTest(
      purchaseForTest({ reason, placedAt: new Date(placedAt) }),
      accountForTest(),
      bbcaForTest,
    );
    const { orderId: id } = savePlacedOrder(database, owner, order);
    if (filledAt === undefined) continue;
    const state = checkOrder({
      order,
      quote: bbcaForTest.quote,
      moment: new Date(filledAt),
      availableCash: owner.startingCash,
      sharesOfStock: {
        held: shares(0),
        setAside: { amount: shares(0), orders: 0 },
      },
    });
    expect(state.kind).toBe("filled");
    saveOrderState(database, id, state);
  }
  const panel = studentPanelData(database, {
    portfolio: readPortfolio(database, owner),
    startingCash: owner.startingCash,
  });
  expect(panel.orderCount).toBe(4);
  expect(panel.reason).toMatchObject({
    reason: "The earlier order filled last",
    filledAt: new Date("2026-11-02T04:00:00Z"),
  });
});
