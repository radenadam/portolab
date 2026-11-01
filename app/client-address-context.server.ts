import { createContext } from "react-router";

/** The address of the network that a request came from, which the server reads from the connection, or from the header of the proxy that decision 0005 describes. Limits on attempts count by it. */
export const clientAddressContext = createContext<string>();
