import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Todo se genera en build: la biblioteca se puede desplegar como sitio estático.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
