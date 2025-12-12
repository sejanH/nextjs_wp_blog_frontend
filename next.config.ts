import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sejan.xyz",
        port: "",
        pathname: "/wp-content/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;
