import { rupiah } from "../../units/rupiah.ts";

/** The cash that each student of a class starts with, unless the lecturer sets another amount. */
export const defaultStartingCash = rupiah(100_000_000);

/** The limits of the starting cash of a class. Less cash buys too few lots of shares to build a portfolio, and the maximum keeps every sum of a class far below the largest whole number that JavaScript holds exactly. */
export const startingCashLimits = {
  minimum: rupiah(1_000_000),
  maximum: rupiah(1_000_000_000_000),
} as const;

/** The most characters of the name of a class. A name of a class names a course and a group, such as Portfolio Management A, which rarely comes near this. */
export const classNameMaximumLength = 100;
