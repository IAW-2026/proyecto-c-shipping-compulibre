import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Allow the local webhook tester to call this endpoint from the browser.
        // In production, lock this down to the real courier's IP or remove it entirely
        // since real webhook calls come server-to-server and don't need CORS headers.
        source: "/api/shipments/update",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NODE_ENV === "production"
              ? (process.env.CORS_ALLOWED_ORIGIN ?? "")
              : "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
    ];
  },
};

export default nextConfig;