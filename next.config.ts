import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/patterns2.csv',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/csv',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
