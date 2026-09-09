import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Every route is prerendered and there is no server code, so the app ships
     as pure static files. Nothing to run at the edge, nothing to cold-start. */
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
