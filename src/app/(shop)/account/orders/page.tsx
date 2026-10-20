import Link from "next/link";
import { Package } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { listUserOrders } from "@/server/services/orders";
import { EmptyState, PageHeader } from "@/components/shared/misc";
import { OrderStatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice, pluralUa } from "@/lib/format";

export const metadata = { title: "Замовлення" };

export default async function OrdersPage() {
  const user = await requireRole("CUSTOMER");
  const orders = await listUserOrders(user.id);
  return (
    <>
      <PageHeader title="Мої замовлення" />
      {orders.length ? (
        <ul className="grid gap-3">
          {orders.map((o) => {
            const qty = o.items.reduce((s, i) => s + i.qty, 0);
            return (
              <li key={o.id}>
                <Link href={`/account/orders/${o.number}`} className="grid gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-extrabold">№{o.number}</span><OrderStatusBadge status={o.status} /></div>
                    <p className="text-sm text-muted-foreground">{formatDate(o.createdAt)} · {qty} {pluralUa(qty, ["товар", "товари", "товарів"])}{o.vehicle ? ` · ${o.vehicle.nickname ?? o.vehicle.plate}` : ""}</p>
                  </div>
                  <span className="text-xl font-extrabold tabular-nums">{formatPrice(o.total)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={Package} title="Замовлень ще немає" text="Знайдіть деталі в каталозі або скористайтеся підбором за VIN.">
          <Button asChild><Link href="/catalog">До каталогу</Link></Button>
        </EmptyState>
      )}
    </>
  );
}
