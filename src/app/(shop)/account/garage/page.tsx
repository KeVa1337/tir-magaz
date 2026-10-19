import Link from "next/link";
import { Car, Plus } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { listVehicles } from "@/server/services/garage";
import { getShopContext } from "@/server/context";
import { VehicleCard } from "@/components/account/vehicle-card";
import { EmptyState, PageHeader } from "@/components/shared/misc";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Гараж" };

export default async function GaragePage() {
  const user = await requireRole("CUSTOMER");
  const [vehicles, { ctx }] = await Promise.all([listVehicles(user.id), getShopContext()]);
  return (
    <>
      <PageHeader title="Гараж" description="Тягачі, вантажівки та причепи вашого автопарку">
        <Button asChild><Link href="/account/garage/new"><Plus /> Додати авто</Link></Button>
      </PageHeader>
      {vehicles.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {vehicles.map((v) => <VehicleCard key={v.id} v={{ ...v, oeCount: v.oeNumbers.length, active: ctx?.vehicleId === v.id }} href={`/account/garage/${v.id}`} />)}
          <Link href="/account/garage/new" className="bg-grid flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground hover:border-primary/60 hover:text-foreground">
            <Plus className="size-7" /><span className="font-semibold">Додати тягач або причіп</span>
          </Link>
        </div>
      ) : (
        <EmptyState icon={Car} title="Гараж порожній" text="Додайте авто за VIN — і каталог показуватиме тільки сумісні деталі, а менеджер підбиратиме запчастини під ваш номер шасі.">
          <Button asChild size="lg"><Link href="/account/garage/new"><Plus /> Додати перше авто</Link></Button>
        </EmptyState>
      )}
    </>
  );
}
