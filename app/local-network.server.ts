import { BlockList, isIP } from "node:net";
import { networkInterfaces } from "node:os";

type NetworkInterfaces = ReturnType<typeof networkInterfaces>;

/** A page at an address of this computer on one of its networks, with the name of the connection, such as Wi-Fi, so that a reader tells several apart. */
interface NetworkAddress {
  connectionName: string;
  address: string;
}

/** Where other devices open a page. It is the address that the reader opened, unless only this computer can open its host. Then it is each address of this computer on a network, of which there are none when the computer is on no network. */
export type AddressesForOthers =
  | { kind: "asOpened"; address: string }
  | {
      kind: "onLocalNetwork";
      openedHost: string;
      addresses: NetworkAddress[];
    }
  | { kind: "noNetwork"; openedHost: string };

// RFC 6761 reserves the name localhost and every name under it for this computer, and RFC 1122 and RFC 4291 reserve these addresses for it.
const loopbackAddresses = new BlockList();
loopbackAddresses.addSubnet("127.0.0.0", 8, "ipv4");
loopbackAddresses.addAddress("::1", "ipv6");

// A mask of 32 bits makes a network of one address, such as the tunnel of a VPN, which no other device can be on.
const singleAddressMask = "255.255.255.255";

/** Finds where other devices open a page that the reader opened at a URL. A page on a host that only this computer can open, such as localhost, moves to each address of this computer on a network, which a phone on the same Wi-Fi network can open. */
export function addressesForOthers(
  url: URL,
  interfaces: NetworkInterfaces = networkInterfaces(),
): AddressesForOthers {
  if (!isLoopbackHost(url.hostname)) {
    return { kind: "asOpened", address: url.href };
  }
  const addresses = localNetworkAddresses(url, interfaces);
  return addresses.length === 0
    ? { kind: "noNetwork", openedHost: url.hostname }
    : { kind: "onLocalNetwork", openedHost: url.hostname, addresses };
}

/** The same page as a URL at each IPv4 address of this computer on a network that other devices can be on. Only IPv4 counts, because a person can type such an address from a projector, while an IPv6 address is long, and one that only the local network knows needs the name of a connection, which a browser cannot open. */
export function localNetworkAddresses(
  url: URL,
  interfaces: NetworkInterfaces = networkInterfaces(),
): NetworkAddress[] {
  const addresses: NetworkAddress[] = [];
  for (const [connectionName, entries] of Object.entries(interfaces)) {
    for (const entry of entries ?? []) {
      if (
        entry.family === "IPv4" &&
        !entry.internal &&
        entry.netmask !== singleAddressMask
      ) {
        const address = new URL(url);
        address.hostname = entry.address;
        addresses.push({ connectionName, address: address.href });
      }
    }
  }
  return addresses;
}

/** Whether only the computer that opens a host can reach it, as the URL parser writes the host. */
function isLoopbackHost(hostname: string): boolean {
  // A name may end in the dot of the root of DNS, which leads to the same host.
  const name = hostname.endsWith(".") ? hostname.slice(0, -1) : hostname;
  if (name === "localhost" || name.endsWith(".localhost")) {
    return true;
  }
  // The URL parser writes an IPv6 address in brackets.
  const address = name.replace(/^\[(.*)\]$/, "$1");
  switch (isIP(address)) {
    case 4:
      return loopbackAddresses.check(address, "ipv4");
    case 6:
      return loopbackAddresses.check(address, "ipv6");
  }
  // Portolab cannot see where another name leads on the devices of others, so it keeps the name that the reader opened.
  return false;
}
