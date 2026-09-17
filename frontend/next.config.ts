import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      // Фото товаров до 5 МБ (лимит API) + служебные байты multipart.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
