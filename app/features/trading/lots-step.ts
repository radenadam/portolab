import { lots } from "~/units/lots";
import type { Lots } from "~/units/lots";
import type { OrderFailure } from "./order";

type NotEnoughShares = Extract<OrderFailure, { kind: "notEnoughShares" }>;

/** The lots of the stock of a rejected sale that no other open sell order sets aside, which is the largest sale that the account can place. */
export function freeLotsOf(failure: NotEnoughShares): Lots {
  return lots(failure.heldLots - failure.setAside.amount);
}

type LotsSteps = {
  [Kind in OrderFailure["kind"]]: (
    failure: Extract<OrderFailure, { kind: Kind }>,
  ) => Lots | undefined;
};

function noStep(): undefined {
  return undefined;
}

// Only a rejection for the cash or the shares that the order needs has a number of lots that the account allows instead.
const lotsSteps: LotsSteps = {
  notEnoughCash: (failure) =>
    failure.largestLots > 0 ? failure.largestLots : undefined,
  notEnoughShares: (failure) => {
    const freeLots = freeLotsOf(failure);
    return freeLots > 0 ? freeLots : undefined;
  },
  missingRules: noStep,
  missingCosts: noStep,
  missingUniverse: noStep,
  noPrice: noStep,
  outsideUniverse: noStep,
  noPriceHistory: noStep,
  tooFewReturns: noStep,
  noReferenceClose: noStep,
  outsideLimits: noStep,
  offTick: noStep,
};

/** The lots of an order that the available cash or the shares that open sell orders leave allow in place of a rejected one, which the rejection offers as a button that changes the order form to them, or undefined when the rejection has no such step. The rejected order had more lots, so these lots are within the largest order of its trading day too. */
export function lotsStepOf(failure: OrderFailure): Lots | undefined {
  return stepOf(failure.kind, failure);
}

// Passing the kind on its own lets TypeScript match the step of each kind to the failures of that kind.
function stepOf<Kind extends OrderFailure["kind"]>(
  kind: Kind,
  failure: Extract<OrderFailure, { kind: Kind }>,
): Lots | undefined {
  return lotsSteps[kind](failure);
}
