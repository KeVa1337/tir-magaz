import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/guards";
import { getUserOrder } from "@/server/services/orders";
import { vehicleTitle } from "@/server/services/fitment";
import { Breadcrumbs } from "@/components/shared/misc";
import { OrderStatusBadge } from "@/components/shared/status";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatKm, formatPrice, toNumber } from "@/lib/format";
import { deliveryLabel, paymentLabel } from "@/lib/labels";

export default async function OrderPage({ params }: PageProps<"/account/orders/[number]">) {
  const { number } = await params;
  const user = await requireRole("CUSTOMER");
  const o = await getUserOrder(user.id, Number(number));
  if (!o) notFound();
  return (
    <>
      <Breadcrumbs items={[{ label: "Замовлення", href: "/account/orders" }, { label: `№${o.number}` }]} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Замовлення №{o.number}</h1>
        <OrderStatusBadge status={o.status} />
        <span className="text-sm text-muted-foreground">{formatDateTime(o.createdAt)}</span>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-6">
          <Card>
            <CardContent className="pt-5"><OrderTimeline status={o.status} history={o.history} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Товари</CardTitle></CardHeader>
            <ul className="divide-y border-t">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 px-5 py-3">
                  <span className="min-w-0">
                    {i.product?.isActive ? <Link href={`/product/${i.product.slug}`} className="font-semibold hover:underline">{i.name}</Link> : <span className="font-semibold">{i.name}</span>}
                    <span className="block text-xs text-muted-foreground"><span className="font-num">{i.article}</span> · {i.brandName} · {formatPrice(i.price)} × {i.qty}{i.warehouse ? ` · ${i.warehouse}` : ""}</span>
                  </span>
                  <span className="shrink-0 font-bold tabular-nums">{formatPrice(toNumber(i.price) * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t px-5 py-4 text-lg font-extrabold"><span>Разом</span><span className="tabular-nums">{formatPrice(o.total)}</span></div>
          </Card>
        </div>
        <aside className="grid content-start gap-6">
          <Card>
            <CardHeader><CardTitle>Доставка й оплата</CardTitle></CardHeader>
            <CardContent className="grid gap-1.5 text-sm">
              <p><b>{deliveryLabel(o.deliveryMethod)}</b></p>
              {o.deliveryCity && <p>{o.deliveryCity}{o.deliveryBranch ? `, ${o.deliveryBranch}` : ""}{o.deliveryAddress ? `, ${o.deliveryAddress}` : ""}</p>}
              <p className="mt-2"><b>{paymentLabel(o.paymentMethod)}</b></p>
              <p className="mt-2 text-muted-foreground">{o.contactName} · {o.contactPhone}</p>
              {o.comment && <p className="mt-2 rounded-md bg-muted p-2 text-muted-foreground">{o.comment}</p>}
            </CardContent>
          </Card>
          {o.vehicle && (
            <Card>
              <CardHeader><CardTitle>Авто</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <Link href={`/account/garage/${o.vehicle.id}`} className="font-semibold hover:underline">{o.vehicle.nickname ?? vehicleTitle(o.vehicle)}</Link>
                {o.mileageKm && <p className="text-muted-foreground">Пробіг при покупці: <span className="font-num">{formatKm(o.mileageKm)}</span></p>}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
