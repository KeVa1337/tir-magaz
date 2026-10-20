import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Сайт переважно динамічний (сесії, кошик, контекст «Моє авто») — Cache Components поки не вмикаємо.
  cacheComponents: false,
  serverExternalPackages: ["exceljs"],
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
