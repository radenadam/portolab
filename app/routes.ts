import { index, route } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  index("features/home/home-page.tsx"),
  route("language", "features/language/language-route.ts"),
  route("health", "features/health/health-route.ts"),
] satisfies RouteConfig;
