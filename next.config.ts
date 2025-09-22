import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    serverPassword: process.env.SERVER_PASSWORD || "admin",
  },
};

export default nextConfig;
