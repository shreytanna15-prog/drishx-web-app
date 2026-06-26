import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/cart",
        destination: "/basket",
      },
    ];
  },
};

export default nextConfig;
