import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { listVehicles, serviceStatus } from "@/server/services/garage";
import { listUserOrders } from "@/server/services/orders";
import { listUserVinRequests } from "@/server/services/vinRequests";
import { getShopContext } from "@/server/context";
import { VehicleCard } from "@/components/account/vehicle-card";
import { OrderStatusBadge, VinStatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice, timeAgo } from "@/lib/format";

export const metadata = { title: "Огляд" };

export default async function AccountHome() {
  const user = await requireRole("CUSTOMER");
  const [vehicles, orders, requests, { ctx }] = await Promise.all([listVehicles(user.id), listUserOrders(user.id, 5), listUserVinRequests(user.id), getShopContext()]);
  const open = requests.filter((r) => r.status !== "CLOSED");
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Вітаємо, {user.name?.split(" ")[0] ?? "водію"}!</h1>
        <p className="text-muted-foreground">Ваш автопарк, замовлення та запити менеджеру</p>
      </div>

      {open.some((r) => r.status === "ANSWERED") && (
        <Link href={`/account/vin-requests/${open.find((r) => r.status === "ANSWERED")!.number}`} className="flex items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/10 p-4 font-semibold">
          Менеджер відповів на ваш VIN-запит — перегляньте підібрані деталі <ArrowRight className="size-5" />
        </Link>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Мої авто</h2>
          <Button asChild variant="ghost" size="sm"><Link href="/account/garage/new"><Plus /> Додати</Link></Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {vehicles.map((v) => <VehicleCard key={v.id} v={{ ...v, oeCount: v.oeNumbers.length, active: ctx?.vehicleId === v.id, serviceLeft: serviceStatus(v)?.left ?? null }} href={`/account/garage/${v.id}`} />)}
          {!vehicles.length && (
            <Link href="/account/garage/new" className="bg-grid flex min-h-36 items-center justify-center gap-2 rounded-xl border border-dashed font-semibold text-muted-foreground hover:text-foreground"><Plus /> Додайте перше авто за VIN</Link>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b p-4"><h2 className="font-extrabold">Останні замовлення</h2><Link href="/account/orders" className="text-sm text-muted-foreground hover:text-foreground">Усі →</Link></div>
          <ul className="divide-y">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.number}`} className="flex items-center justify-between gap-3 p-4 hover:bg-accent/50">
                  <span><span className="block font-bold">№{o.number}</span><span className="text-xs text-muted-foreground">{formatDate(o.createdAt)}{o.vehicle ? ` · ${o.vehicle.nickname ?? o.vehicle.plate}` : ""}</span></span>
                  <span className="flex flex-col items-end gap-1"><span className="font-bold tabular-nums">{formatPrice(o.total)}</span><OrderStatusBadge status={o.status} /></span>
                </Link>
              </li>
            ))}
            {!orders.length && <li className="p-4 text-sm text-muted-foreground">Замовлень ще немає.</li>}
          </ul>
        </section>
        <section className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b p-4"><h2 className="font-extrabold">Відкриті VIN-запити</h2><Link href="/account/vin-requests" className="text-sm text-muted-foreground hover:text-foreground">Усі →</Link></div>
          <ul className="divide-y">
            {open.map((r) => (
              <li key={r.id}>
                <Link href={`/account/vin-requests/${r.number}`} className="flex items-center justify-between gap-3 p-4 hover:bg-accent/50">
                  <span className="min-w-0"><span className="block truncate font-semibold">{r.message}</span><span className="text-xs text-muted-foreground">№{r.number} · {timeAgo(r.updatedAt)}</span></span>
                  <VinStatusBadge status={r.status} />
                </Link>
              </li>
            ))}
            {!open.length && <li className="p-4 text-sm text-muted-foreground">Немає відкритих запитів. <Link href="/account/vin-requests/new" className="underline">Створити</Link></li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
