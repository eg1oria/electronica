import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Сборка в .next/standalone — в образ попадает только нужный код,
  // без dev-зависимостей. Запуск: node server.js
  output: "standalone",
  reactCompiler: true,
  // Не раскрываем стек в заголовке X-Powered-By.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Фото товаров до 5 МБ (лимит API) + служебные байты multipart.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
