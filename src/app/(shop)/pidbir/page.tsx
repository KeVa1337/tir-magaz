import type { Metadata } from "next";
import Link from "next/link";
import { getVehicleDirectory } from "@/server/services/catalog";
import { VehiclePicker } from "@/components/shop/vehicle-picker";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";

export const metadata: Metadata = { title: "Підбір запчастин за моделлю", description: "Оберіть марку, серію і двигун тягача або напівпричепа — покажемо сумісні запчастини." };

export default async function PickerPage() {
  const directory = await getVehicleDirectory();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Головна", href: "/" }, { label: "Підбір за моделлю" }]} />
      <PageHeader title="Підбір за моделлю" description={<>Без реєстрації: оберіть свою машину — покажемо тільки сумісні деталі. Для точного підбору за номером шасі — <Link href="/vin" className="font-semibold text-foreground underline">VIN</Link>.</>} />
      <VehiclePicker directory={directory} />
    </div>
  );
}
