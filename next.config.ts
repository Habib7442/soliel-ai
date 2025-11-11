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
      { hostname: "img.clerk.com" },
      // { hostname: "ebzjisaqomoombvmbyyb.supabase.co" } // Add Supabase storage domain
    ],
  },
  // Enable React Compiler (optional, may increase compile times)
  // reactCompiler: true,
};

export default nextConfig;
