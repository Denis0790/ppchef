import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.twcstorage.ru",
      },
      {
        protocol: "https",
        hostname: "media.ppchef.ru",
      },
    ],
  },
};

export default nextConfig;