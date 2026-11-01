import { isIP } from "node:net";
import { createContext } from "react-router";
import { fail, succeed } from "./result";
import type { Result } from "./result";
import { describeValue } from "./value-shapes";

/** The network that a request came from, which the server reads from the connection, or from the header of the proxy that decision 0005 describes. Limits on attempts count by it. */
export const clientAddressContext = createContext<string>();

// One subscriber of IPv6 holds a whole prefix of 64 bits, so a limit that counted each address apart would let one visitor rotate through endless addresses.
const ipv6NetworkGroups = 4;
const ipv6Groups = 8;

/** Reads the network of a visitor from the address that Express takes from a header of a trusted proxy: an IPv4 address as it is, and an IPv6 address as its prefix of 64 bits. A forged header can hold any text, and a limit on attempts keeps the network, so only an IP address passes. */
export function parseClientNetwork(
  value: unknown,
  source: string,
): Result<string, string> {
  if (typeof value === "string") {
    switch (isIP(value)) {
      case 4:
        return succeed(value);
      case 6:
        return succeed(ipv6Network(value));
    }
  }
  return fail(
    `${source} must be an IP address, but it is ${describeValue(value)}.`,
  );
}

function ipv6Network(address: string): string {
  // Node writes the address of an IPv4 visitor in the form of IPv6 when it listens on both, and such an address counts as the IPv4 address.
  const embedded = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address)?.[1];
  if (embedded !== undefined) {
    return embedded;
  }
  const [head = "", tail] = address.toLowerCase().split("::");
  const headGroups = head === "" ? [] : head.split(":");
  const tailGroups = tail === undefined || tail === "" ? [] : tail.split(":");
  // Two colons stand for the groups of zeros that the address leaves out.
  const zeros = Array.from(
    { length: ipv6Groups - headGroups.length - tailGroups.length },
    () => "0",
  );
  const groups =
    tail === undefined ? headGroups : [...headGroups, ...zeros, ...tailGroups];
  const prefix = groups
    .slice(0, ipv6NetworkGroups)
    .map((group) => Number.parseInt(group, 16).toString(16));
  return `${prefix.join(":")}::/64`;
}
