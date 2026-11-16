import { setTimeout as wait } from "node:timers/promises";
import { secondMilliseconds } from "~/time-units";

// A stalled request must end before the next minute of the price schedule.
const requestTimeoutMilliseconds = 20 * secondMilliseconds;
// Decision 0001 spaces history requests to keep the load on the source low.
const historyRequestPauseMilliseconds = secondMilliseconds;

export function priceRequestSignal(): AbortSignal {
  return AbortSignal.timeout(requestTimeoutMilliseconds);
}

export function waitBetweenPriceRequests(): Promise<void> {
  return wait(historyRequestPauseMilliseconds);
}
