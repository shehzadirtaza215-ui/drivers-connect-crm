import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles these automatically, but explicit for clarity
  reactStrictMode: true,
  poweredByHeader: false,

  // Required for Supabase file storage URLs
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
