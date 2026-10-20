import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Сайт переважно динамічний (сесії, кошик, контекст «Моє авто») — Cache Components поки не вмикаємо.
  cacheComponents: false,
  serverExternalPackages: ["exceljs"],
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
    // Shared-хостинг (Hostinger) жорстко обмежує кількість потоків/процесів —
    // збираємо в одному процесі з мінімумом воркерів.
    cpus: 1,
    workerThreads: false,
    webpackBuildWorker: false,
    staticGenerationMaxConcurrency: 1,
  },
};

export default nextConfig;
