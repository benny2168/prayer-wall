import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.planningcenteronline.com',
      },
      {
        protocol: 'https',
        hostname: 'planningcenteronline.com',
      },
      {
        protocol: 'http',
        hostname: '*.planningcenteronline.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
