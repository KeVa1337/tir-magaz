import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { adminGetProduct } from "@/server/services/admin/products";
import { getVehicleDirectory } from "@/server/services/catalog";
import { AttributesEditor, FitmentsEditor, ImagesEditor, NumbersEditor, ProductMainForm } from "@/components/admin/product-editor";
import { Breadcrumbs } from "@/components/shared/misc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { first, type SP } from "@/lib/search-params";
import { productFormRefs } from "../form-data";

const s = (v: { toString(): string } | null | undefined) => (v == null ? "" : v.toString());

export default async function AdminProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const sp = (await searchParams) as SP;
  const [p, refs, directory] = await Promise.all([adminGetProduct(id), productFormRefs(), getVehicleDirectory()]);
  if (!p) notFound();
  return (
    <div className="grid gap-6">
      <Breadcrumbs items={[{ label: "Товари", href: "/admin/products" }, { label: p.article }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{p.name}</h1>
          <p className="text-sm text-muted-foreground"><span className="font-num">{p.sku}</span> · {p.brand.name} · оновлено {formatDateTime(p.updatedAt)}</p>
        </div>
        <Button asChild variant="outline"><Link href={`/product/${p.slug}`} target="_blank"><ExternalLink /> На сайті</Link></Button>
      </div>
      {first(sp.created) && <p className="rounded-md bg-success/10 p-3 text-sm text-success">Товар створено. Додайте фото, номери та застосовність.</p>}
      <div className="grid gap-6 2xl:grid-cols-2">
        <Card><CardContent className="pt-5">
          <ProductMainForm brands={refs.brands} categories={refs.categories} v={{
            id: p.id, name: p.name, article: p.article, sku: p.sku, slug: p.slug, brandId: p.brandId, categoryId: p.categoryId, description: p.description ?? "",
            price: s(p.price), oldPrice: s(p.oldPrice), purchasePrice: s(p.purchasePrice), stockQty: String(p.stockQty), stockStatus: p.stockStatus,
            leadTimeDays: s(p.leadTimeDays), weightKg: s(p.weightKg), isActive: p.isActive, isPopular: p.isPopular, isUniversal: p.isUniversal,
            seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "",
          }} />
        </CardContent></Card>
        <div className="grid content-start gap-6">
          <Card><CardHeader><CardTitle>Фото ({p.images.length})</CardTitle></CardHeader><CardContent><ImagesEditor productId={p.id} images={p.images} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Номери: OE і крос ({p.numbers.length})</CardTitle></CardHeader><CardContent><NumbersEditor productId={p.id} numbers={p.numbers} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Атрибути</CardTitle></CardHeader><CardContent><AttributesEditor productId={p.id} attributes={p.attributes.map((a) => ({ name: a.name, value: a.value }))} /></CardContent></Card>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Застосовність ({p.fitments.length})</CardTitle></CardHeader>
        <CardContent>
          <FitmentsEditor productId={p.id} directory={directory} fitments={p.fitments.map((f) => ({
            id: f.id, make: f.make?.name ?? null, series: f.series?.name ?? null, engine: f.engineCode?.code ?? null, axleBrand: f.axleBrand,
            yearFrom: f.yearFrom, yearTo: f.yearTo, chassisFrom: f.chassisFrom, chassisTo: f.chassisTo, position: f.position, note: f.note,
          }))} />
        </CardContent>
      </Card>
    </div>
  );
}
