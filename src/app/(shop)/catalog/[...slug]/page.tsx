import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug } from "@/server/services/catalog";
import { getShopContext } from "@/server/context";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";
import { ProductListing } from "@/components/shop/product-listing";
import { parseFilters, type SP } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/catalog/[...slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug[slug.length - 1]);
  if (!cat) return {};
  return { title: `${cat.name} для вантажівок`, description: `${cat.name} для тягачів DAF, MAN, Volvo, Scania, Mercedes-Benz, Renault, Iveco. Підбір за VIN, оригінал і аналоги.` };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/catalog/[...slug]">) {
  const { slug } = await params;
  const sp = (await searchParams) as SP;
  const cat = await getCategoryBySlug(slug[slug.length - 1]);
  if (!cat || !cat.isActive) notFound();
  const { ctx } = await getShopContext();
  const categoryIds = [cat.id, ...cat.children.map((c) => c.id)];
  const parentPath = cat.parent ? `/catalog/${cat.parent.slug}` : null;
  const basePath = cat.parent ? `/catalog/${cat.parent.slug}/${cat.slug}` : `/catalog/${cat.slug}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Головна", href: "/" }, { label: "Каталог", href: "/catalog" }, ...(cat.parent ? [{ label: cat.parent.name, href: parentPath! }] : []), { label: cat.name }]} />
      <PageHeader title={cat.name} description={ctx ? `Бейджі сумісності показані для: ${ctx.label}` : "Оберіть «Моє авто» вгорі, щоб бачити сумісність деталей"} />
      {cat.children.length > 0 && (
        <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
          {cat.children.map((c) => (
            <Link key={c.id} href={`/catalog/${cat.slug}/${c.slug}`} className={cn("shrink-0 rounded-full border bg-card px-4 py-2 text-sm font-semibold hover:border-primary/50")}>
              {c.name}
            </Link>
          ))}
        </div>
      )}
      <ProductListing base={{ categoryIds }} filters={parseFilters(sp)} sp={sp} ctx={ctx} basePath={basePath} />
    </div>
  );
}
