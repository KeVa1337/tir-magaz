import { getVehicleDirectory } from "@/server/services/catalog";
import { VehicleForm } from "@/components/account/vehicle-form";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";
import { normalize } from "@/lib/normalize";
import { first, type SP } from "@/lib/search-params";

export const metadata = { title: "Додати авто" };

export default async function NewVehiclePage({ searchParams }: PageProps<"/account/garage/new">) {
  const sp = (await searchParams) as SP;
  const vin = first(sp.vin);
  const directory = await getVehicleDirectory();
  return (
    <>
      <Breadcrumbs items={[{ label: "Гараж", href: "/account/garage" }, { label: "Нове авто" }]} />
      <PageHeader
        title={first(sp.welcome) ? "Вітаємо! Додайте своє перше авто" : "Додати авто в гараж"}
        description="Введіть VIN — заповнимо марку, рік і номер шасі. Решту уточніть вручну."
      />
      <VehicleForm directory={directory} initial={{ kind: "TRACTOR", vin: vin ? normalize(vin) : undefined }} autoDecode={!!vin} />
    </>
  );
}
