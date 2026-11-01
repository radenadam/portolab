import { createContext } from "react-router";

/** The address of the network that a request came from, which the server reads from the connection, or from the header of a proxy on the same machine. Limits on attempts count by it. */
export const clientAddressContext = createContext<string>();
