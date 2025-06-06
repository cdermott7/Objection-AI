/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ["@mysten/sui.js"],
  experimental: {
    esmExternals: 'loose'
  }
};

module.exports = nextConfig;
