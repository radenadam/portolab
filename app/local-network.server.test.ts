import type { NetworkInterfaceInfo } from "node:os";
import { expect, test } from "vitest";
import {
  addressesForOthers,
  localNetworkAddresses,
} from "./local-network.server";

const ipv4Netmasks = {
  8: "255.0.0.0",
  24: "255.255.255.0",
  32: "255.255.255.255",
};

const ipv6Netmasks = {
  64: "ffff:ffff:ffff:ffff::",
  128: "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
};

function ipv4(
  address: string,
  prefixLength: keyof typeof ipv4Netmasks,
  internal = false,
): NetworkInterfaceInfo {
  return {
    address,
    netmask: ipv4Netmasks[prefixLength],
    family: "IPv4",
    mac: "00:00:00:00:00:00",
    internal,
    cidr: `${address}/${String(prefixLength)}`,
  };
}

function ipv6(
  address: string,
  prefixLength: keyof typeof ipv6Netmasks,
  internal = false,
): NetworkInterfaceInfo {
  return {
    address,
    netmask: ipv6Netmasks[prefixLength],
    family: "IPv6",
    mac: "00:00:00:00:00:00",
    internal,
    cidr: `${address}/${String(prefixLength)}`,
    scopeid: 0,
  };
}

// A laptop as a lecturer brings it: the loopback, a VPN, a virtual machine, and the Wi-Fi network of the class.
const laptopInterfaces = {
  "Loopback Pseudo-Interface 1": [
    ipv6("::1", 128, true),
    ipv4("127.0.0.1", 8, true),
  ],
  VPN: [ipv4("203.0.113.9", 32)],
  "VMware Network Adapter VMnet8": [
    ipv6("fe80::1", 64),
    ipv4("198.51.100.1", 24),
  ],
  "Wi-Fi": [ipv6("fe80::2", 64), ipv4("192.0.2.20", 24)],
};

const thisComputerPages = [
  "http://localhost:3000/join/k7qm-4rxt",
  "http://LOCALHOST.:3000/join/k7qm-4rxt",
  "http://portolab.localhost:3000/join/k7qm-4rxt",
  "http://127.0.0.1:3000/join/k7qm-4rxt",
  "http://127.1.2.3:3000/join/k7qm-4rxt",
  "http://[::1]:3000/join/k7qm-4rxt",
  "http://[::ffff:127.0.0.1]:3000/join/k7qm-4rxt",
  "http://0.0.0.0:3000/join/k7qm-4rxt",
  "http://0:3000/join/k7qm-4rxt",
  "http://0.1.2.3:3000/join/k7qm-4rxt",
  "http://[::]:3000/join/k7qm-4rxt",
  "http://[0:0:0:0:0:0:0:0]:3000/join/k7qm-4rxt",
  "http://[::ffff:0.0.0.0]:3000/join/k7qm-4rxt",
];

test("lists the page at each IPv4 address of this computer on a network that other devices can be on, with the name of its connection", () => {
  expect(
    localNetworkAddresses(
      new URL("http://localhost:3000/join/k7qm-4rxt?from=class#code"),
      laptopInterfaces,
    ),
  ).toEqual([
    {
      connectionName: "VMware Network Adapter VMnet8",
      address: "http://198.51.100.1:3000/join/k7qm-4rxt?from=class#code",
    },
    {
      connectionName: "Wi-Fi",
      address: "http://192.0.2.20:3000/join/k7qm-4rxt?from=class#code",
    },
  ]);
});

test("keeps the address that the reader opened when other devices can open its host", () => {
  for (const address of [
    "https://portolab.example.ac.id/join/k7qm-4rxt",
    "http://192.0.2.20:3000/join/k7qm-4rxt",
    "http://[2001:db8::20]:3000/join/k7qm-4rxt",
    "http://laptop.local:3000/join/k7qm-4rxt",
  ]) {
    expect(addressesForOthers(new URL(address), laptopInterfaces)).toEqual({
      kind: "asOpened",
      address,
    });
  }
});

test("moves a page on a host that only this computer can open to each address of this computer on its networks", () => {
  for (const page of thisComputerPages) {
    const url = new URL(page);
    expect(addressesForOthers(url, laptopInterfaces), page).toEqual({
      kind: "onLocalNetwork",
      openedHost: url.hostname,
      addresses: [
        {
          connectionName: "VMware Network Adapter VMnet8",
          address: "http://198.51.100.1:3000/join/k7qm-4rxt",
        },
        {
          connectionName: "Wi-Fi",
          address: "http://192.0.2.20:3000/join/k7qm-4rxt",
        },
      ],
    });
  }
});

test("finds no address for others when only this computer can open the host and the computer is on no network", () => {
  const offline = {
    "Loopback Pseudo-Interface 1":
      laptopInterfaces["Loopback Pseudo-Interface 1"],
    VPN: laptopInterfaces.VPN,
  };
  for (const page of thisComputerPages) {
    const url = new URL(page);
    expect(addressesForOthers(url, offline), page).toEqual({
      kind: "noNetwork",
      openedHost: url.hostname,
    });
  }
});
