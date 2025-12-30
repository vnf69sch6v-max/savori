import type { NextConfig } from "next";

import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false, // process.env.NODE_ENV === "development",  // Enable for testing locally if needed, usually disable in dev
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  turbopack: {}, // Silence Next.js 16 turbopack warning
};

export default withPWA(nextConfig);
