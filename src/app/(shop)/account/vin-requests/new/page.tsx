import { requireRole } from "@/server/auth/guards";
import { listGarageOptions } from "@/server/services/fitment";
import { db } from "@/server/db";
import { VinRequestForm } from "@/components/shop/vin-request-form";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";
import { first, type SP } from "@/lib/search-params";

export const metadata = { title: "Новий VIN-запит" };

export default async function NewVinRequestPage({ searchParams }: PageProps<"/account/vin-requests/new">) {
  const sp = (await searchParams) as SP;
  const user = await requireRole("CUSTOMER");
  const vehicles = await listGarageOptions(user.id);
  const productSlug = first(sp.product);
  const product = productSlug ? await db.product.findUnique({ where: { slug: productSlug }, select: { name: true, article: true, brand: { select: { name: true } } } }) : null;
  return (
    <div className="max-w-2xl">
      <Breadcrumbs items={[{ label: "VIN-запити", href: "/account/vin-requests" }, { label: "Новий" }]} />
      <PageHeader title="Запит менеджеру" description="Менеджер перевірить деталі за VIN у каталогах виробника і відповість списком, який можна додати в кошик." />
      <div className="rounded-xl border bg-card p-5">
        <VinRequestForm
          loggedIn
          vehicles={vehicles}
          defaultVehicleId={first(sp.vehicle)}
          defaultMessage={product ? `Чи підходить ${product.name} (${product.brand.name} ${product.article})?` : undefined}
        />
      </div>
    </div>
  );
}
