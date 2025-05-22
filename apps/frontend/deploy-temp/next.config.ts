import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ["@mysten/sui.js"],
  experimental: {
    esmExternals: "loose"
  }
};

export default nextConfig;