import { PackageSearch } from "lucide-react";
import type { VehicleContext } from "@/server/services/fitment";
import { getFacets, listProducts, type ProductFilters } from "@/server/services/catalog";
import { EmptyState, Pagination } from "@/components/shared/misc";
import { pluralUa } from "@/lib/format";
import { toQuery, type SP } from "@/lib/search-params";
import { ProductGrid } from "./product-card";
import { ActiveFilterChips, CatalogFilters, MobileFilters, SortSelect } from "./catalog-filters";

/** Список товарів з фільтрами, сортуванням і пагінацією — спільний для каталогу, марок і причепів. */
export async function ProductListing({ base, filters, sp, ctx, basePath }: {
  base: Partial<ProductFilters>; filters: ProductFilters; sp: SP; ctx: VehicleContext | null; basePath: string;
}) {
  const f = { ...filters, ...base };
  const [list, facets] = await Promise.all([listProducts(f, ctx), getFacets(f, ctx)]);

  const chips: { label: string; param: string; value?: string }[] = [];
  if (f.onlyFit && ctx) chips.push({ label: `Для: ${ctx.shortLabel}`, param: "fit" });
  if (f.inStock) chips.push({ label: "В наявності", param: "stock" });
  if (filters.makeSlug) chips.push({ label: facets.makes.find((m) => m.slug === filters.makeSlug)?.name ?? filters.makeSlug, param: "make" });
  for (const b of filters.brandSlugs ?? []) chips.push({ label: facets.brands.find((x) => x.slug === b)?.name ?? b, param: "brand", value: b });
  if (f.priceMin) chips.push({ label: `від ${f.priceMin} ₴`, param: "pmin" });
  if (f.priceMax) chips.push({ label: `до ${f.priceMax} ₴`, param: "pmax" });
  for (const [n, vals] of Object.entries(f.attrs ?? {})) for (const v of vals) chips.push({ label: `${n}: ${v}`, param: "a", value: `${n}:${v}` });

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <CatalogFilters facets={facets} vehicleLabel={ctx?.label ?? null} />
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Знайдено <b className="text-foreground">{list.total}</b> {pluralUa(list.total, ["товар", "товари", "товарів"])}
          </p>
          <div className="flex gap-2">
            <MobileFilters facets={facets} vehicleLabel={ctx?.label ?? null} activeCount={chips.length} />
            <SortSelect />
          </div>
        </div>
        <ActiveFilterChips chips={chips} />
        <div className="mt-4">
          {list.items.length ? (
            <ProductGrid items={list.items} />
          ) : (
            <EmptyState icon={PackageSearch} title="Нічого не знайдено" text="Змініть фільтри або надішліть VIN-запит — менеджер підбере деталь вручну." />
          )}
        </div>
        <Pagination page={list.page} pages={list.pages} makeHref={(p) => `${basePath}${toQuery(sp, { page: String(p) })}`} />
      </div>
    </div>
  );
}
