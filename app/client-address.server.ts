import { isIP } from "node:net";
import { createContext } from "react-router";
import { fail, succeed } from "./result";
import type { Result } from "./result";
import { describeValue } from "./value-shapes";

/** The network that a request came from, which the server reads from the connection, or from the header of the proxy that decision 0005 describes. Limits on attempts count by it. */
export const clientAddressContext = createContext<string>();

// One subscriber of IPv6 holds a whole prefix of 64 bits, so a limit that counted each address apart would let one visitor rotate through endless addresses.
const ipv6NetworkGroups = 4;
const ipv6GroupCount = 8;
// A group of IPv6 holds two bytes, such as two of the four numbers of an IPv4 address.
const byteValues = 256;

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
  const groups = ipv6Groups(address);
  // Node writes the address of an IPv4 visitor in the form of IPv6 when it listens on both, and such an address counts as the IPv4 address.
  if (isIpv4Mapped(groups)) {
    const high = groups[6] ?? 0;
    const low = groups[7] ?? 0;
    return [
      Math.floor(high / byteValues),
      high % byteValues,
      Math.floor(low / byteValues),
      low % byteValues,
    ].join(".");
  }
  const prefix = groups
    .slice(0, ipv6NetworkGroups)
    .map((group) => group.toString(16));
  return `${prefix.join(":")}::/64`;
}

// RFC 4291 maps an IPv4 address to five groups of zeros, a group of ffff, and the IPv4 address in the last two groups.
function isIpv4Mapped(groups: number[]): boolean {
  return (
    groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff
  );
}

/** The eight numbers of 16 bits of an address that isIP accepts as IPv6. */
function ipv6Groups(address: string): number[] {
  // A zone after a percent sign names an interface of the server, not a part of the address.
  const [written = ""] = address.split("%");
  const [head = "", tail] = written.split("::");
  const headGroups = groupsOf(head);
  const tailGroups = tail === undefined ? [] : groupsOf(tail);
  // Two colons stand for the groups of zeros that the address leaves out.
  const zeros = Array.from(
    { length: ipv6GroupCount - headGroups.length - tailGroups.length },
    () => 0,
  );
  return [...headGroups, ...zeros, ...tailGroups];
}

function groupsOf(part: string): number[] {
  const groups: number[] = [];
  if (part === "") {
    return groups;
  }
  for (const group of part.split(":")) {
    if (group.includes(".")) {
      // An address may end in the four numbers of an IPv4 address, which take the place of its last two groups.
      const [first = 0, second = 0, third = 0, fourth = 0] = group
        .split(".")
        .map(Number);
      groups.push(first * byteValues + second, third * byteValues + fourth);
    } else {
      groups.push(Number.parseInt(group, 16));
    }
  }
  return groups;
}
