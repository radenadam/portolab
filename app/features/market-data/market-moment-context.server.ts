import { createContext } from "react-router";

// Historical browser flows need a recorded market moment without replacing the process clock.
export const marketMomentContext = createContext<Date | null>(null);
