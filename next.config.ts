import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // The phone's browser requests dev-only assets from the LAN host while
  // Next is serving this app locally. This only applies to `next dev`.
  allowedDevOrigins: ["192.168.0.115"],
};

export default nextConfig;
