import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable Turbopack filesystem caching for development
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      // Add Supabase storage domain
      { hostname: "ykxeyistnxwdopmrcqht.supabase.co" }
    ],
  },
  // Enable React Compiler (optional, may increase compile times)
  // reactCompiler: true,
};

export default nextConfig;