import { ProductMainForm } from "@/components/admin/product-editor";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";
import { Card, CardContent } from "@/components/ui/card";
import { productFormRefs } from "../form-data";

export const metadata = { title: "Новий товар" };

export default async function NewProductPage() {
  const refs = await productFormRefs();
  return (
    <div className="grid max-w-4xl gap-4">
      <Breadcrumbs items={[{ label: "Товари", href: "/admin/products" }, { label: "Новий" }]} />
      <PageHeader title="Новий товар" description="Після створення стануть доступні фото, номери, застосовність і атрибути" className="mb-0" />
      <Card><CardContent className="pt-5">
        <ProductMainForm brands={refs.brands} categories={refs.categories} v={{ name: "", article: "", sku: "", slug: "", brandId: "", categoryId: "", description: "", price: "", oldPrice: "", purchasePrice: "", stockQty: "0", stockStatus: "IN_STOCK", leadTimeDays: "", weightKg: "", isActive: true, isPopular: false, isUniversal: false, seoTitle: "", seoDescription: "" }} />
      </CardContent></Card>
    </div>
  );
}
