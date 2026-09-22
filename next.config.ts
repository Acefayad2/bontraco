import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* The app is no longer a static export: it authenticates users, stores
     uploaded documents and runs analysis jobs, all of which need a server.
     See docs/TECHNICAL-PLAN.md for what deploying this now requires. */
  serverExternalPackages: ["better-sqlite3", "pdfjs-dist"],
};

export default nextConfig;
