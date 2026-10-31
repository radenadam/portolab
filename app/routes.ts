import { index, route } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  index("features/home/home-page.tsx"),
  route("prices", "features/market-data/prices-page.tsx"),
  route("language", "features/language/language-page.tsx"),
  route("health", "features/health/health-route.ts"),
  route("*", "not-found-page.tsx"),
] satisfies RouteConfig;
