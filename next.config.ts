import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "172.20.10.2",
        port: "4000",
        pathname: "/api/v1/utility/uploads/**",
      },
    ],
  },
};

export default nextConfig;
