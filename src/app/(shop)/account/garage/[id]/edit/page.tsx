import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/guards";
import { getVehicle } from "@/server/services/garage";
import { getVehicleDirectory } from "@/server/services/catalog";
import { VehicleForm } from "@/components/account/vehicle-form";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";

export const metadata = { title: "Редагувати авто" };

export default async function EditVehiclePage({ params }: PageProps<"/account/garage/[id]/edit">) {
  const { id } = await params;
  const user = await requireRole("CUSTOMER");
  const [v, directory] = await Promise.all([getVehicle(user.id, id), getVehicleDirectory()]);
  if (!v) notFound();
  return (
    <>
      <Breadcrumbs items={[{ label: "Гараж", href: "/account/garage" }, { label: v.nickname ?? "Авто", href: `/account/garage/${v.id}` }, { label: "Редагування" }]} />
      <PageHeader title="Редагувати авто" />
      <VehicleForm directory={directory} initial={v} />
    </>
  );
}
