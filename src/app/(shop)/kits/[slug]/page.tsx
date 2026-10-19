import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getKitBySlug, kitTotal, toCard } from "@/server/services/catalog";
import { getShopContext } from "@/server/context";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";
import { ProductCard } from "@/components/shop/product-card";
import { AddKitButton } from "@/components/shop/add-to-cart";
import { formatPrice } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/kits/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const kit = await getKitBySlug(slug);
  return kit ? { title: kit.name, description: kit.description ?? undefined } : {};
}

export default async function KitPage({ params }: PageProps<"/kits/[slug]">) {
  const { slug } = await params;
  const kit = await getKitBySlug(slug);
  if (!kit || !kit.isActive) notFound();
  const { ctx } = await getShopContext();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Комплекти ТО", href: "/kits" }, { label: kit.name }]} />
      <PageHeader title={kit.name} description={kit.description ?? undefined}>
        <span className="self-center text-2xl font-extrabold tabular-nums">{formatPrice(kitTotal(kit.items))}</span>
        <AddKitButton kitId={kit.id} className="h-12" />
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {kit.items.map((i) => (
          <ProductCard key={i.id} p={toCard(i.product, ctx)} note={i.qty > 1 ? <p className="text-xs font-semibold text-primary">У комплекті: {i.qty} шт.</p> : undefined} />
        ))}
      </div>
    </div>
  );
}
