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
  route("classes", "features/classes/classes-page.tsx"),
  route("classes/:classId", "features/classes/class-page.tsx"),
  route("classes/:classId/calendar", "features/classes/calendar-page.tsx"),
  route("classes/:classId/market", "features/market-data/market-page.tsx"),
  route("classes/:classId/orders", "features/trading/orders-page.tsx"),
  route("classes/:classId/measures", "features/measures/measures-page.tsx"),
  route("classes/:classId/stocks/:code", "features/market-data/stock-page.tsx"),
  route(
    "classes/:classId/stocks/:code/:side",
    "features/trading/stock-ticket-fallback.ts",
  ),
  route(
    "classes/:classId/portfolios",
    "features/grading/class-portfolios-page.tsx",
  ),
  route(
    "classes/:classId/portfolios/export",
    "features/grading/workbook-route.tsx",
  ),
  route(
    "classes/:classId/students/:studentId/portfolio",
    "features/grading/student-portfolio-page.tsx",
  ),
  route(
    "classes/:classId/students/:studentId/measures",
    "features/grading/student-measures-page.tsx",
  ),
  route(
    "classes/:classId/students/:studentId/password",
    "features/classes/reset-password-page.tsx",
  ),
  route("join", "features/classes/join-page.tsx"),
  route("join/:code", "features/classes/join-class-page.tsx"),
  route("language", "features/language/language-page.tsx"),
  route("health", "features/health/health-route.ts"),
  route("*", "not-found-page.tsx"),
] satisfies RouteConfig;
