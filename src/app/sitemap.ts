import type { MetadataRoute } from "next";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [products, cats, makes, kits] = await Promise.all([
    db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ where: { isActive: true }, select: { slug: true, parent: { select: { slug: true } } } }),
    db.vehicleMake.findMany({ where: { isActive: true, kind: { not: "TRAILER" } }, select: { slug: true } }),
    db.serviceKit.findMany({ where: { isActive: true }, select: { slug: true } }),
  ]);
  const staticPages = ["", "/catalog", "/vin", "/trailers", "/kits", "/about", "/contacts", "/delivery-payment", "/warranty-returns"];
  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...cats.map((c) => ({ url: `${base}/catalog/${c.parent ? `${c.parent.slug}/` : ""}${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...makes.map((m) => ({ url: `${base}/brands/${m.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...kits.map((k) => ({ url: `${base}/kits/${k.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "daily" as const, priority: 0.6 })),
  ];
}
