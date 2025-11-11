import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable Cache Components
  cacheComponents: true,
  // Enable Turbopack filesystem caching for development
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  // Enable React Compiler (optional, may increase compile times)
  // reactCompiler: true,
};

export default nextConfig;