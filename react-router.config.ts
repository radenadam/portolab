import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  // Decision 0005 explains why the middleware of the root route checks the origin of every form instead of React Router.
  allowedActionOrigins: ["**"],
} satisfies Config;
