import { isIP } from "node:net";
import { createContext } from "react-router";
import { fail, succeed } from "./result";
import type { Result } from "./result";
import { describeValue } from "./value-shapes";

/** The address of the network that a request came from, which the server reads from the connection, or from the header of the proxy that decision 0005 describes. Limits on attempts count by it. */
export const clientAddressContext = createContext<string>();

/** Reads the address of a network, which Express takes from a header of a trusted proxy. A forged header can hold any text, and a limit on attempts keeps the address, so only an IP address passes. */
export function parseNetworkAddress(
  value: unknown,
  source: string,
): Result<string, string> {
  return typeof value === "string" && isIP(value) !== 0
    ? succeed(value)
    : fail(
        `${source} must be an IP address, but it is ${describeValue(value)}.`,
      );
}
