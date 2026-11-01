/** A number of lots, the unit in which IDX trades shares, such as 5 lots of 100 shares each. A count of lots, such as the lots that the cash pays for, can be 0. */
export type Lots = number & { readonly brand: "Lots" };

/** The size of an order, which is at least 1 lot. It is a number of lots too, so it goes wherever lots go. */
export type OrderLots = Lots & { readonly orderBrand: "OrderLots" };

function isLots(value: number): value is Lots {
  return Number.isSafeInteger(value) && value >= 0;
}

function isOrderLots(value: number): value is OrderLots {
  return isLots(value) && value >= 1;
}

/** Makes a number of lots that the program computed or holds, such as a constant, into lots. A number of lots comes from whole numbers, so a value that is negative or not whole is a defect. */
export function lots(count: number): Lots {
  if (!isLots(count)) {
    throw new Error(`${String(count)} is not a whole number of lots.`);
  }
  return count;
}

/** Makes the size of an order that the program holds, such as a constant, into the lots of an order. */
export function orderLots(count: number): OrderLots {
  if (!isOrderLots(count)) {
    throw new Error(`${String(count)} is not a whole number of lots from 1.`);
  }
  return count;
}
