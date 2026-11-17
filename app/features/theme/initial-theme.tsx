import { use } from "react";
import type { ReactNode } from "react";
import { initialThemeContext as InitialThemeContext } from "./initial-theme-context";
import type { Theme } from "./theme";

export function InitialThemeProvider({
  theme,
  children,
}: {
  theme: Theme;
  children: ReactNode;
}): ReactNode {
  return <InitialThemeContext value={theme}>{children}</InitialThemeContext>;
}

export function useInitialTheme(): Theme {
  return use(InitialThemeContext);
}
