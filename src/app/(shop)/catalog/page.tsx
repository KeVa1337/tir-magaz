import Link from "next/link";
import type { Metadata } from "next";
import { getCategoryTree } from "@/server/services/catalog";
import { getShopContext } from "@/server/context";
import { CategoryIcon } from "@/components/shared/icons";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";
import { ProductListing } from "@/components/shop/product-listing";
import { parseFilters, type SP } from "@/lib/search-params";

export const metadata: Metadata = { title: "Каталог запчастин", description: "Каталог запчастин для вантажівок і напівпричепів: двигун, гальма, пневматика, підвіска, кабіна, трансмісія, електрика." };

export default async function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  const sp = (await searchParams) as SP;
  const filters = parseFilters(sp);
  const { ctx } = await getShopContext();
  const tree = await getCategoryTree();
  const listing = filters.onlyFit || filters.brandSlugs?.length || filters.makeSlug || filters.inStock;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Головна", href: "/" }, { label: "Каталог" }]} />
      <PageHeader
        title={listing && ctx && filters.onlyFit ? `Деталі для ${ctx.label}` : "Каталог запчастин"}
        description={listing ? undefined : "Оберіть розділ або скористайтеся пошуком за номером деталі чи VIN"}
      />
      {listing ? (
        <ProductListing base={{}} filters={filters} sp={sp} ctx={ctx} basePath="/catalog" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tree.map((c) => (
            <section key={c.id} className="rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
              <Link href={`/catalog/${c.slug}`} className="mb-3 flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><CategoryIcon icon={c.icon} className="size-6" /></span>
                <span>
                  <span className="block text-lg font-bold">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.count} товарів</span>
                </span>
              </Link>
              <ul className="grid gap-0.5">
                {c.children.map((ch) => (
                  <li key={ch.id}>
                    <Link href={`/catalog/${c.slug}/${ch.slug}`} className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent">
                      {ch.name} <span className="text-xs text-muted-foreground tabular-nums">{ch.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
