import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin is a Node-only package with native/optional deps; keep it
  // external so it is required at runtime instead of bundled by Turbopack.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
