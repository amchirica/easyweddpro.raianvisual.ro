import type { NextConfig } from "next";

/**
 * Keep this config lean for `next dev` (Turbopack).
 * Do NOT migrate middleware.ts → proxy.ts yet: OpenNext treats proxy
 * as Node middleware and fails on Cloudflare Workers.
 */
const nextConfig: NextConfig = {
  turbopack: {},
  // Logo upload allows up to 2MB; leave headroom for multipart FormData overhead.
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
    authInterrupts: true,
  },
};

export default nextConfig;

if (process.env.NODE_ENV === "development") {
  void import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev();
  });
}
