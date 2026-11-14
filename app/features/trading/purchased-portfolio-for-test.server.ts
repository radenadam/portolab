import { checkPortfolioOrders } from "./check-open-orders.server";
import {
  bbcaForTest,
  duringSessionForTest,
  orderLotsForTest,
  purchaseForTest,
} from "./orders-for-test";
import {
  placedOrderForTest,
  studentWithQuotesForTest,
} from "./portfolios-for-test.server";

/** The purchase of tradedPortfolioForTest also tests the daily change before its later sale. */
export async function purchasedPortfolioForTest() {
  const result = await studentWithQuotesForTest(
    [bbcaForTest.quote],
    bbcaForTest.quote.quotedAt,
  );
  placedOrderForTest(
    result.database,
    result.owner,
    purchaseForTest({ lots: orderLotsForTest(200) }),
  );
  checkPortfolioOrders(
    result.database,
    result.owner.membershipId,
    duringSessionForTest,
  );
  return result;
}
