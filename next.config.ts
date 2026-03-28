import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable the middleware deprecation warning
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
