import type { NextConfig } from "next";

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  transpilePackages: ["@practicallab/ui"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiBaseUrl}/api/:path*` }];
  },
};

export default nextConfig;
