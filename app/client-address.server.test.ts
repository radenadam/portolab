import { expect, test } from "vitest";
import { parseNetworkAddress } from "./client-address.server";

test("reads an IPv4 or an IPv6 address", () => {
  for (const address of ["192.0.2.1", "::1", "2001:db8::7"]) {
    expect(parseNetworkAddress(address, "The address")).toEqual({
      ok: true,
      value: address,
    });
  }
});

test("rejects any other text that a forged header can hold, and names it", () => {
  expect(parseNetworkAddress("x".repeat(3), "The address")).toEqual({
    ok: false,
    failure: 'The address must be an IP address, but it is "xxx".',
  });
  expect(parseNetworkAddress(undefined, "The address")).toEqual({
    ok: false,
    failure: "The address must be an IP address, but it is missing.",
  });
});
