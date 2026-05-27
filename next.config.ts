import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        // Google OAuth avatars
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // Leaflet relies on window — only load on client
  transpilePackages: ["leaflet", "react-leaflet"],
};

export default nextConfig;
