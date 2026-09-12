import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "pub-9443ddc1d0e740e2909f0144104f1e5e.r2.dev",
      },
    ],
  },
};

export default nextConfig;