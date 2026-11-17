import { m } from "~/paraglide/messages.js";
import type { Theme } from "./theme";

export function themeName(theme: Theme): string {
  const names: Record<Theme, () => string> = {
    system: m.theme_system_label,
    light: m.theme_light_label,
    dark: m.theme_dark_label,
  };
  return names[theme]();
}
