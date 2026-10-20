import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { findOrderForGuest } from "@/server/services/orders";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { OrderStatusBadge } from "@/components/shared/status";
import { Breadcrumbs } from "@/components/shared/misc";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatDateTime, formatPrice, toNumber } from "@/lib/format";
import { deliveryLabel } from "@/lib/labels";
import { first, type SP } from "@/lib/search-params";

export const metadata: Metadata = { title: "Статус замовлення", robots: { index: false } };

export default async function OrderStatusPage({ searchParams }: PageProps<"/order-status">) {
  const sp = (await searchParams) as SP;
  const n = first(sp.n)?.replace(/\D/g, "") ?? "";
  const phone = first(sp.phone) ?? "";
  const searched = !!(n && phone);
  const order = searched ? await findOrderForGuest(Number(n), phone) : null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Головна", href: "/" }, { label: "Статус замовлення" }]} />
      <h1 className="mb-1 text-3xl font-extrabold">Де моє замовлення?</h1>
      <p className="mb-6 text-muted-foreground">Без входу в кабінет: номер замовлення і телефон, вказаний при оформленні.</p>
      <form className="grid gap-3 rounded-xl border bg-card p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="grid gap-1.5"><Label htmlFor="n">Номер замовлення</Label><Input id="n" name="n" defaultValue={n} inputMode="numeric" placeholder="10003" className="font-num" /></div>
        <div className="grid gap-1.5"><Label htmlFor="phone">Телефон</Label><Input id="phone" name="phone" type="tel" defaultValue={phone} inputMode="tel" placeholder="+380…" /></div>
        <Button size="lg">Перевірити</Button>
      </form>
      {searched && !order && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <PackageSearch className="size-5 text-warning" /> Замовлення не знайдено. Перевірте номер і телефон або зателефонуйте нам.
        </div>
      )}
      {order && (
        <div className="mt-6 grid gap-5 rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-extrabold">№{order.number}</h2>
            <OrderStatusBadge status={order.status} />
            <span className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)} · {deliveryLabel(order.deliveryMethod)}</span>
          </div>
          <OrderTimeline status={order.status} history={order.history} />
          <ul className="divide-y border-t text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-2"><span>{i.name} <span className="font-num text-xs text-muted-foreground">{i.article} × {i.qty}</span></span><span className="tabular-nums">{formatPrice(toNumber(i.price) * i.qty)}</span></li>
            ))}
          </ul>
          <p className="text-right font-extrabold">Разом: <span className="tabular-nums">{formatPrice(order.total)}</span></p>
        </div>
      )}
    </div>
  );
}
