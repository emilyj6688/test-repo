import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Relative assetPrefix for GitHub Pages ensures CSS/JS load cleanly regardless of trailing slashes or repo subpaths
  assetPrefix: "./",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
