import { adminListMakes, adminListPartBrands } from "@/server/services/admin/catalog";
import { BrandsManager } from "@/components/admin/brands-manager";
import { PageHeader } from "@/components/shared/misc";

export const metadata = { title: "Бренди і марки" };

export default async function BrandsPage() {
  const [brands, makes] = await Promise.all([adminListPartBrands(), adminListMakes()]);
  return (
    <div className="max-w-5xl">
      <PageHeader title="Бренди і марки" description="Довідники для каталогу, гаража і VIN-декодера" />
      <BrandsManager brands={brands} makes={makes} />
    </div>
  );
}
