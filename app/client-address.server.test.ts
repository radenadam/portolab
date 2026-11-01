import { expect, test } from "vitest";
import { parseClientNetwork } from "./client-address.server";

test("reads an IPv4 address as its own network", () => {
  for (const address of ["192.0.2.1", "::ffff:192.0.2.1", "::FFFF:192.0.2.1"]) {
    expect(parseClientNetwork(address, "The address")).toEqual({
      ok: true,
      value: "192.0.2.1",
    });
  }
});

test("reads an IPv6 address as its prefix of 64 bits, however it is written", () => {
  for (const [address, network] of [
    ["2001:db8:0:7:1:2:3:4", "2001:db8:0:7::/64"],
    ["2001:0DB8:0000:0007:ffff::1", "2001:db8:0:7::/64"],
    ["2001:db8::7", "2001:db8:0:0::/64"],
    ["::1", "0:0:0:0::/64"],
  ] as const) {
    expect(parseClientNetwork(address, "The address"), address).toEqual({
      ok: true,
      value: network,
    });
  }
});

test("rejects any other text that a forged header can hold, and names it", () => {
  expect(parseClientNetwork("x".repeat(3), "The address")).toEqual({
    ok: false,
    failure: 'The address must be an IP address, but it is "xxx".',
  });
  expect(parseClientNetwork(undefined, "The address")).toEqual({
    ok: false,
    failure: "The address must be an IP address, but it is missing.",
  });
});
