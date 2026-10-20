import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { getCategoriesForMake, getKits, getMakeBySlug, kitTotal } from "@/server/services/catalog";
import { getShopContext } from "@/server/context";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";
import { CategoryIcon } from "@/components/shared/icons";
import { ProductListing } from "@/components/shop/product-listing";
import { first, parseFilters, type SP } from "@/lib/search-params";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/brands/[truckBrand]">): Promise<Metadata> {
  const { truckBrand } = await params;
  const make = await getMakeBySlug(truckBrand);
  if (!make) return {};
  return {
    title: `Запчастини ${make.name}`,
    description: `Запчастини для ${make.name} ${make.series.map((s) => s.name).join(", ")}: фільтри, гальма, пневматика, підвіска. Підбір за VIN і номером шасі.`,
  };
}

export default async function BrandPage({ params, searchParams }: PageProps<"/brands/[truckBrand]">) {
  const { truckBrand } = await params;
  const sp = (await searchParams) as SP;
  const make = await getMakeBySlug(truckBrand);
  if (!make) notFound();
  const seriesSlug = first(sp.series);
  const series = make.series.find((s) => s.slug === seriesSlug);
  const { ctx } = await getShopContext();
  const [cats, kits] = await Promise.all([getCategoriesForMake(make.id, series?.id), getKits({ makeId: make.id })]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Головна", href: "/" }, { label: "Каталог", href: "/catalog" }, { label: make.name, href: series ? `/brands/${make.slug}` : undefined }, ...(series ? [{ label: series.name }] : [])]} />
      <PageHeader title={`Запчастини ${make.name}${series ? ` ${series.name}` : ""}`} description={`${make.country ?? ""} · ${make.series.length} серій у каталозі`} />

      <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
        <Link href={`/brands/${make.slug}`} className={cn("shrink-0 rounded-lg border px-4 py-2.5 text-sm font-bold", !series ? "border-primary bg-primary/10" : "bg-card hover:bg-accent")}>Усі серії</Link>
        {make.series.map((s) => (
          <Link key={s.id} href={`/brands/${make.slug}?series=${s.slug}`} className={cn("shrink-0 rounded-lg border px-4 py-2 text-sm", s.id === series?.id ? "border-primary bg-primary/10" : "bg-card hover:bg-accent")}>
            <span className="block font-bold">{s.name}</span>
            <span className="text-xs text-muted-foreground">{s.yearFrom ?? "…"}–{s.yearTo ?? "н.ч."} · {s.engines.map((e) => e.code).join(", ") || "—"}</span>
          </Link>
        ))}
      </div>

      {cats.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {cats.slice(0, 12).map((c) => (
            <Link key={c.id} href={`/catalog/${c.parent?.slug ? `${c.parent.slug}/` : ""}${c.slug}?make=${make.slug}`} className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm hover:border-primary/50">
              <CategoryIcon icon={c.icon} className="size-4 text-primary" /> <span className="min-w-0 flex-1 truncate font-semibold">{c.name}</span> <span className="text-xs text-muted-foreground">{c.count}</span>
            </Link>
          ))}
        </div>
      )}

      {kits.length > 0 && (
        <div className="mb-8 grid gap-2 md:grid-cols-2">
          {kits.map((k) => (
            <Link key={k.id} href={`/kits/${k.slug}`} className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 hover:border-primary">
              <span className="flex items-center gap-3"><Wrench className="size-5 text-primary" /><span className="font-bold">{k.name}</span></span>
              <span className="font-extrabold tabular-nums">{formatPrice(kitTotal(k.items))}</span>
            </Link>
          ))}
        </div>
      )}

      <ProductListing base={{ makeSlug: make.slug, seriesId: series?.id }} filters={parseFilters(sp)} sp={sp} ctx={ctx} basePath={`/brands/${make.slug}`} key={series?.id ?? "all"} />
    </div>
  );
}
