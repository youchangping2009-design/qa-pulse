import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/trends/weekly",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
