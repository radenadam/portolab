import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { InitialThemeProvider } from "./features/theme/initial-theme";
import { parseTheme } from "./features/theme/parse-theme";

const initialTheme = parseTheme(
  document.documentElement.dataset["theme"],
  "html[data-theme]",
);
if (!initialTheme.ok) throw new Error(initialTheme.failure);

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <InitialThemeProvider theme={initialTheme.value}>
        <HydratedRouter />
      </InitialThemeProvider>
    </StrictMode>,
  );
});
