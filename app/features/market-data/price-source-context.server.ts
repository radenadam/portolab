import { createContext } from "react-router";
import type { PriceSource } from "./price-source.server";

/** The source that the server chose at startup, which the server hands to every loader and action. */
export const priceSourceContext = createContext<PriceSource>();
