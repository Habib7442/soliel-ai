import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // experimental: {
  //   turbopackFileSystemCacheForDev: true,
  // },
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { hostname: "ykxeyistnxwdopmrcqht.supabase.co" },
      { hostname: "plxyuglexvpmicfaisno.supabase.co" },
      { hostname: "api.dicebear.com" },
      { hostname: "images.unsplash.com" },
      { hostname: "lh3.googleusercontent.com" }
    ],
  },
  // Enable React Compiler (optional, may increase compile times)
  // reactCompiler: true,
};

export default nextConfig;