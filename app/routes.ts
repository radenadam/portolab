import { index, route } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  index("features/home/home-page.tsx"),
  route("prices", "features/market-data/prices-page.tsx"),
  route("sign-in", "features/accounts/sign-in-page.tsx"),
  route("sign-out", "features/accounts/sign-out-page.tsx"),
  route("account", "features/accounts/account-page.tsx"),
  route("account/setup", "features/accounts/account-setup-page.tsx"),
  route("privacy", "features/accounts/privacy-page.tsx"),
  route("language", "features/language/language-page.tsx"),
  route("health", "features/health/health-route.ts"),
  route("*", "not-found-page.tsx"),
] satisfies RouteConfig;
