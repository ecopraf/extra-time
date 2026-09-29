import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@extra-time/football-domain",
    "@extra-time/types",
    "@extra-time/ui",
  ],
};

export default nextConfig;
