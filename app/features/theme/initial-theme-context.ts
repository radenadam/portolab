import { createContext } from "react";
import { defaultTheme } from "./theme";
import type { Theme } from "./theme";

export const initialThemeContext = createContext<Theme>(defaultTheme);
