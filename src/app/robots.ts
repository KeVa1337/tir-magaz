import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // Демо не індексуємо; для продакшену прибрати DEMO_MODE.
  if (process.env.DEMO_MODE === "true") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/cart", "/checkout", "/api", "/search"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
