import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { orderDayOf } from "./order-form";
import { orderTicketStatus, readOrderTicket } from "./order-ticket.server";
import {
  duringSessionForTest,
  mondayTradingDayForTest,
} from "./orders-for-test";

const delayMinutes = 10;

/** The ticket of a page at an address with the query of a test, at a moment. */
function ticketAt(
  search: string,
  now: Date,
): ReturnType<typeof readOrderTicket> {
  return readOrderTicket(openDatabaseForTest(), {
    url: new URL(`/classes/1/portfolio${search}`, "http://localhost"),
    now,
    delayMinutes,
  });
}

test("reads the trading day of an order placed now and the stock that the address chose, with the status of a page that shows them", () => {
  const chosen = ticketAt("?code=BBCA", duringSessionForTest);
  expect(chosen.day).toEqual({
    ok: true,
    value: orderDayOf(mondayTradingDayForTest),
  });
  expect(chosen.choice).toMatchObject({ kind: "chosen", code: "BBCA" });
  expect(orderTicketStatus(chosen)).toBe(200);
  const choosing = ticketAt("", duringSessionForTest);
  expect(choosing.choice).toEqual({ kind: "choosing", failure: undefined });
  expect(orderTicketStatus(choosing)).toBe(200);
});

test("answers an address that chose a stock that Portolab does not trade as a wrong value, with the reason at the field that chooses a stock", () => {
  const unknown = ticketAt("?code=BREN", duringSessionForTest);
  expect(unknown.choice).toMatchObject({ kind: "choosing" });
  expect(
    unknown.choice.kind === "choosing" ? unknown.choice.failure : undefined,
  ).toContain('"BREN"');
  expect(orderTicketStatus(unknown)).toBe(400);
});

test("chooses no stock while the trading day of an order placed now lacks the rules of IDX", () => {
  // An order placed at 10:00 WIB on Monday 3 January 2028 trades on a day that no calendar covers.
  const missingDay = ticketAt("?code=BREN", new Date("2028-01-03T03:00:00Z"));
  expect(missingDay.day).toMatchObject({ ok: false });
  expect(missingDay.choice).toEqual({ kind: "choosing", failure: undefined });
  expect(orderTicketStatus(missingDay)).toBe(200);
});
