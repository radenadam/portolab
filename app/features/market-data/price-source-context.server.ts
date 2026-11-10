import { createContext } from "react-router";
import type { RouterContextProvider } from "react-router";
import type {
  PriceSource,
  PriceSourceDescription,
} from "./price-source.server";

/** The source that the server chose at startup, which the server hands to every loader and action. */
export const priceSourceContext = createContext<PriceSource>();

/** What a page tells about the source of its prices, from the source that the server chose, so that a loader of another feature never reads the context of this one. */
export function readPriceSourceDescription(
  context: Readonly<RouterContextProvider>,
): PriceSourceDescription {
  const { name, delayMinutes } = context.get(priceSourceContext);
  return { name, delayMinutes };
}
