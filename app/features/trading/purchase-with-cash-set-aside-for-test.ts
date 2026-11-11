import { lots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { OrderFailure } from "./order";
import { orderLotsForTest } from "./orders-for-test";

/** A purchase of 5 lots of BBCA at Rp4,980, which costs Rp2,493,735, while one open buy order of 1 lot sets aside Rp498,747 of a cash of Rp2,500,000. The available cash of Rp2,001,253 pays for 4 lots, which cost Rp1,994,988, and 1 lot at a price of at most Rp19,982, as the decimal module of Python computed with a broker fee of 0.15% rounded with ROUND_HALF_UP. */
export const purchaseWithCashSetAsideForTest = {
  kind: "notEnoughCash",
  code: "BBCA",
  lots: orderLotsForTest(5),
  price: rupiah(4_980),
  value: rupiah(2_490_000),
  fee: rupiah(3_735),
  tax: rupiah(0),
  cash: rupiah(2_500_000),
  setAside: { amount: rupiah(498_747), orders: 1 },
  holdsFreeShares: false,
  sales: { codes: [], orders: 0 },
  availableCash: rupiah(2_001_253),
  largestLots: lots(4),
  highestLotPrice: rupiah(19_982),
  minimumPrice: rupiah(1),
} satisfies OrderFailure;
