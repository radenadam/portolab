export const themes = ["system", "light", "dark"] as const;
export type Theme = (typeof themes)[number];
export const defaultTheme: Theme = "system";
export const themeCookieName = "portolab_theme";
export const themeLifetimeDays = 180;
