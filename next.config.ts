import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Browser automation may load the dev app as 127.0.0.1 while assets use localhost.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
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
