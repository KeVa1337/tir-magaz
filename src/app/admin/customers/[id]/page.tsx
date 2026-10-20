import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetCustomer } from "@/server/services/users";
import { CustomerNoteForm } from "@/components/admin/note-form";
import { VehicleCard } from "@/components/account/vehicle-card";
import { Breadcrumbs } from "@/components/shared/misc";
import { OrderStatusBadge, VinStatusBadge } from "@/components/shared/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatPrice, toNumber } from "@/lib/format";

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const c = await adminGetCustomer(id);
  if (!c) notFound();
  const spent = c.orders.filter((o) => !["CANCELLED", "RETURNED"].includes(o.status)).reduce((s, o) => s + toNumber(o.total), 0);
  return (
    <div className="grid gap-6">
      <Breadcrumbs items={[{ label: "Клієнти", href: "/admin/customers" }, { label: c.name ?? c.email ?? "Клієнт" }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{c.name}</h1>
          <p className="text-sm text-muted-foreground">{c.email} · <span className="font-num">{c.phone}</span> · з {formatDate(c.createdAt)}</p>
        </div>
        <div className="flex gap-6 text-right">
          <div><p className="text-xs text-muted-foreground">Замовлень</p><p className="text-xl font-extrabold">{c.orders.length}</p></div>
          <div><p className="text-xs text-muted-foreground">Сума покупок</p><p className="text-xl font-extrabold tabular-nums">{formatPrice(spent)}</p></div>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid content-start gap-6">
          <section>
            <h2 className="mb-3 font-extrabold">Автопарк ({c.vehicles.length})</h2>
            <div className="grid gap-4 md:grid-cols-2">{c.vehicles.map((v) => <VehicleCard key={v.id} v={{ ...v, oeCount: v.oeNumbers.length }} />)}</div>
          </section>
          <Card>
            <CardHeader><CardTitle>Замовлення</CardTitle></CardHeader>
            <ul className="divide-y border-t">
              {c.orders.map((o) => (
                <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-accent/50"><span><b>№{o.number}</b> · {formatDate(o.createdAt)}</span><span className="flex items-center gap-3"><span className="tabular-nums">{formatPrice(o.total)}</span><OrderStatusBadge status={o.status} /></span></Link></li>
              ))}
              {!c.orders.length && <li className="px-5 py-3 text-sm text-muted-foreground">Немає</li>}
            </ul>
          </Card>
        </div>
        <aside className="grid content-start gap-6">
          <Card><CardHeader><CardTitle>Нотатка менеджера</CardTitle></CardHeader><CardContent><CustomerNoteForm id={c.id} note={c.managerNote ?? ""} /></CardContent></Card>
          <Card>
            <CardHeader><CardTitle>VIN-запити</CardTitle></CardHeader>
            <ul className="divide-y border-t">
              {c.vinRequests.map((r) => <li key={r.id}><Link href={`/admin/vin-requests/${r.id}`} className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm hover:bg-accent/50"><span className="truncate">№{r.number} · {r.message}</span><VinStatusBadge status={r.status} /></Link></li>)}
              {!c.vinRequests.length && <li className="px-5 py-3 text-sm text-muted-foreground">Немає</li>}
            </ul>
          </Card>
          <Card>
            <CardHeader><CardTitle>Адреси</CardTitle></CardHeader>
            <CardContent className="grid gap-1 text-sm">{c.addresses.map((a) => <p key={a.id}>{[a.city, a.branch, a.street].filter(Boolean).join(", ")}</p>)}{!c.addresses.length && <p className="text-muted-foreground">Немає</p>}</CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
