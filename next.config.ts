import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las imágenes se sirven tal cual, sin pasar por la optimización de Vercel.
    // El plan gratuito de Vercel solo incluye 5.000 transformaciones al mes y,
    // al pasarse, las imágenes nuevas dejan de verse (error 402).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;