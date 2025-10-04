import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly configure for Vercel deployment with src directory
  output: 'standalone',
  // Ensure Vercel recognizes the src/app structure
  experimental: {
    // Enable any experimental features if needed
  }
};

export default nextConfig;
