import { notFound } from "next/navigation";
import { adminGetKit } from "@/server/services/admin/catalog";
import { getVehicleDirectory } from "@/server/services/catalog";
import { KitEditor } from "@/components/admin/kit-editor";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";
import { toNumber } from "@/lib/format";

export default async function KitEditPage({ params }: PageProps<"/admin/kits/[id]">) {
  const { id } = await params;
  const directory = await getVehicleDirectory();
  const kit = id === "new" ? null : await adminGetKit(id);
  if (id !== "new" && !kit) notFound();
  return (
    <div className="grid gap-4">
      <Breadcrumbs items={[{ label: "Комплекти ТО", href: "/admin/kits" }, { label: kit?.name ?? "Новий" }]} />
      <PageHeader title={kit?.name ?? "Новий комплект ТО"} className="mb-0" />
      <KitEditor directory={directory} initial={kit ? {
        id: kit.id, name: kit.name, description: kit.description ?? "", intervalKm: kit.intervalKm ? String(kit.intervalKm) : "",
        makeId: kit.makeId ?? "", seriesId: kit.seriesId ?? "", engineCodeId: kit.engineCodeId ?? "", isActive: kit.isActive,
        items: kit.items.map((i) => ({ productId: i.product.id, name: i.product.name, article: i.product.article, brand: i.product.brand.name, price: toNumber(i.product.price), qty: i.qty })),
      } : { name: "", description: "", intervalKm: "", makeId: "", seriesId: "", engineCodeId: "", isActive: true, items: [] }} />
    </div>
  );
}
