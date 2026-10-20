import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetOrder } from "@/server/services/orders";
import { vehicleTitle } from "@/server/services/fitment";
import { OrderItemsEditor, OrderMetaForm, StatusChanger } from "@/components/admin/order-editor";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { OrderStatusBadge } from "@/components/shared/status";
import { Breadcrumbs } from "@/components/shared/misc";
import { PartNumber } from "@/components/shared/part-number";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatKm, toNumber } from "@/lib/format";
import { deliveryLabel, paymentLabel } from "@/lib/labels";

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const o = await adminGetOrder(id);
  if (!o) notFound();
  const editable = !["SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"].includes(o.status);
  return (
    <div className="grid gap-6">
      <Breadcrumbs items={[{ label: "Замовлення", href: "/admin/orders" }, { label: `№${o.number}` }]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">Замовлення №{o.number}</h1>
        <OrderStatusBadge status={o.status} />
        <span className="text-sm text-muted-foreground">{formatDateTime(o.createdAt)}</span>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader><CardTitle>Позиції {!editable && <span className="text-sm font-normal text-muted-foreground">(редагування закрито після відправки)</span>}</CardTitle></CardHeader>
            <OrderItemsEditor orderId={o.id} editable={editable} items={o.items.map((i) => ({ id: i.id, name: i.name, article: i.article, brandName: i.brandName, price: toNumber(i.price), qty: i.qty, warehouse: i.warehouse, leadDays: i.leadDays }))} />
          </Card>
          <Card>
            <CardHeader><CardTitle>Контакти і нотатки</CardTitle></CardHeader>
            <CardContent><OrderMetaForm order={{ id: o.id, managerComment: o.managerComment, contactName: o.contactName, contactPhone: o.contactPhone, deliveryCity: o.deliveryCity, deliveryBranch: o.deliveryBranch }} /></CardContent>
          </Card>
        </div>
        <aside className="grid content-start gap-6">
          <Card>
            <CardHeader><CardTitle>Статус</CardTitle></CardHeader>
            <CardContent className="grid gap-5"><StatusChanger orderId={o.id} status={o.status} /><OrderTimeline status={o.status} history={o.history} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Доставка і оплата</CardTitle></CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <p className="font-semibold">{deliveryLabel(o.deliveryMethod)}</p>
              <p>{[o.deliveryCity, o.deliveryBranch, o.deliveryAddress].filter(Boolean).join(", ") || "—"}</p>
              <p className="mt-2 font-semibold">{paymentLabel(o.paymentMethod)}</p>
              {o.contactEmail && <p className="mt-2 text-muted-foreground">{o.contactEmail}</p>}
              {o.comment && <p className="mt-2 rounded-md bg-muted p-2">💬 {o.comment}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Клієнт і авто</CardTitle></CardHeader>
            <CardContent className="grid gap-1.5 text-sm">
              {o.user ? <Link href={`/admin/customers/${o.user.id}`} className="font-semibold hover:underline">{o.user.name}</Link> : <span>Гість</span>}
              {o.vehicle ? (
                <>
                  <span>{o.vehicle.nickname ? `${o.vehicle.nickname} · ` : ""}{vehicleTitle(o.vehicle)}</span>
                  {o.vehicle.vin && <PartNumber value={o.vehicle.vin} />}
                  {o.mileageKm && <span className="text-muted-foreground">Пробіг при покупці: {formatKm(o.mileageKm)}</span>}
                </>
              ) : <span className="text-muted-foreground">Без прив&apos;язки до авто</span>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
