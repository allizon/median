import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/@:username",
        destination: "/profile/:username",
      },
    ];
  },
};

export default nextConfig;
