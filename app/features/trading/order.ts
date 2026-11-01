import type { Lots, OrderLots } from "~/units/lots";
import type { Rupiah } from "~/units/rupiah";
import type { Shares } from "~/units/shares";
import type { PriceFailure } from "./accepted-prices";

export type OrderSide = "buy" | "sell";

/** The price that an order asks for: the delayed price when it fills, or a limit that the price must reach. */
type OrderPrice = { kind: "market" } | { kind: "limit"; limit: Rupiah };

/** An order that a student places, before Portolab checks it. */
export interface OrderRequest {
  /** The code that IDX uses for the stock, such as BBCA. */
  code: string;
  side: OrderSide;
  lots: OrderLots;
  price: OrderPrice;
  placedAt: Date;
}

/** An order that Portolab accepted, with what it fixed when it accepted it. Decision 0016 explains its life. */
export interface Order extends OrderRequest {
  /** The shares in the lots of the order, by the lot of its trading day. */
  shares: Shares;
  /** The trading day on which the order can fill, in WIB, such as 2026-11-02. */
  tradingDay: string;
  /** The start of the first session in which the order trades. A price quoted before it never fills the order. */
  tradesFrom: Date;
  /** When the prices of the trading day become final. From then on the order can no longer fill, and it sets aside nothing. */
  expiresAt: Date;
  /** The price at which Portolab checked the order: its limit, or the latest delayed price for a market order. */
  checkedPrice: Rupiah;
  /** The cash that a buy order holds back from other orders: the value of its shares at the checked price with the broker fee. A sell order holds back none. */
  setAsideCash: Rupiah;
  state: OrderState;
}

/**
 * Where an order stands:
 * - waiting: accepted, and it has met no price of its sessions yet.
 * - resting: a limit order that met a price of its sessions that did not reach its limit, so it waits at its limit, as an order in the book of the exchange does.
 * - filled, expired, or rejected: done, and nothing changes it any more.
 */
export type OrderState =
  | { kind: "waiting" }
  | { kind: "resting" }
  | { kind: "filled"; fill: Fill }
  | { kind: "expired"; expiredAt: Date }
  | { kind: "rejected"; rejectedAt: Date; failure: FillFailure };

/** An order that is waiting or resting, which the texts for students call open. It can fill until it expires. */
export type OpenOrder = Order & {
  state: Extract<OrderState, { kind: "waiting" | "resting" }>;
};

/** How an order filled, and how much cash it moved. */
export interface Fill {
  price: Rupiah;
  /** The price times the shares of the order. */
  value: Rupiah;
  fee: Rupiah;
  /** The final tax on a sale, which a purchase does not pay. */
  tax: Rupiah;
  /** The change of the cash of the account: the value and the fee paid out for a purchase, or the value less the fee and the tax paid in for a sale. */
  cashChange: Rupiah;
  /** When the delayed price was quoted, which is the moment of the market at which the order filled. */
  quotedAt: Date;
  /** When Portolab filled the order. */
  filledAt: Date;
}

/** A purchase and its cost at a price, against the cash that it can use. */
export interface CashShortfall {
  code: string;
  lots: Lots;
  price: Rupiah;
  value: Rupiah;
  fee: Rupiah;
  /** The cash that the order can use: the cash of the account less what other open orders set aside. */
  availableCash: Rupiah;
  /** The most lots that the available cash pays for at the price, with the fee, which can be 0. */
  largestLots: Lots;
}

/** Why Portolab cannot accept an order. Each failure holds the numbers that its text gives to the student. */
export type OrderFailure =
  | {
      kind: "missingRules";
      /** The text for the log, which names the data to add and the date that it must cover. */
      reason: string;
    }
  | { kind: "noPrice"; code: string }
  | { kind: "outsideUniverse"; code: string; date: string }
  | {
      kind: "noPriceHistory";
      code: string;
      /** The instrument without a complete month of stored closes, which is the stock or the IHSG. */
      instrument: string;
    }
  | {
      kind: "tooFewReturns";
      code: string;
      count: number;
      minimum: number;
      /** The first day of the month whose first trading day brings the last missing return once it closes, if the stock keeps trading every month. */
      enoughAfterFirstTradingDayOf: string;
    }
  | {
      kind: "noReferenceClose";
      code: string;
      /** The trading day before the trading day of the order, whose close is the reference price. */
      date: string;
      /** When the prices of that day are final, after which Portolab can store the close. */
      finalAt: Date;
    }
  | { kind: "tooManyLots"; lots: Lots; maximumLots: Lots }
  | (PriceFailure & { code: string; date: string })
  | ({
      kind: "notEnoughCash";
      cash: Rupiah;
      setAsideCash: Rupiah;
      /** Whether the account holds shares that no open sell order sets aside, which it could sell to add to its cash. */
      holdsFreeShares: boolean;
    } & CashShortfall)
  | {
      kind: "notEnoughShares";
      code: string;
      lots: Lots;
      /** The lots of the stock that the account holds. */
      heldLots: Lots;
      /** The lots of the stock in open sell orders. */
      setAsideLots: Lots;
    };

/** Why Portolab rejected an order that it had accepted, when a price could fill it. */
export type FillFailure = {
  kind: "priceRose";
  /** The latest delayed price when the student placed the order. */
  checkedPrice: Rupiah;
} & CashShortfall;
