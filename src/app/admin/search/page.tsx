import Link from "next/link";
import { db } from "@/server/db";
import { normalize } from "@/lib/normalize";
import { adminPickProducts } from "@/server/services/admin/products";
import { PageHeader } from "@/components/shared/misc";
import { OrderStatusBadge, VinStatusBadge } from "@/components/shared/status";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatPrice } from "@/lib/format";
import { first, type SP } from "@/lib/search-params";

export const metadata = { title: "Пошук" };

export default async function AdminSearchPage({ searchParams }: PageProps<"/admin/search">) {
  const q = first(((await searchParams) as SP).q)?.trim() ?? "";
  const n = normalize(q);
  const digits = q.replace(/\D/g, "");
  const [orders, products, customers, vins] = q
    ? await Promise.all([
        db.order.findMany({
          where: { OR: [...(digits && digits.length <= 6 ? [{ number: Number(digits) }] : []), { contactPhone: { contains: digits || "__" } }, { contactName: { contains: q, mode: "insensitive" } }] },
          take: 10, orderBy: { createdAt: "desc" },
        }),
        adminPickProducts(q),
        db.user.findMany({ where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: digits || "__" } }] }, take: 10 }),
        db.vinRequest.findMany({ where: { OR: [{ vin: { contains: n || "__" } }, ...(digits && digits.length <= 5 ? [{ number: Number(digits) }] : []), { vehicle: { vin: { contains: n || "__" } } }] }, take: 10 }),
      ])
    : [[], [], [], []];
  return (
    <div className="grid gap-6">
      <PageHeader title={`Пошук: ${q}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Замовлення ({orders.length})</CardTitle></CardHeader>
          <ul className="divide-y border-t text-sm">{orders.map((o) => <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex justify-between gap-3 px-5 py-2.5 hover:bg-accent/50"><span><b>№{o.number}</b> · {o.contactName} · {formatDate(o.createdAt)}</span><OrderStatusBadge status={o.status} /></Link></li>)}</ul>
        </Card>
        <Card>
          <CardHeader><CardTitle>Товари ({products.length})</CardTitle></CardHeader>
          <ul className="divide-y border-t text-sm">{products.map((p) => <li key={p.id}><Link href={`/admin/products/${p.id}`} className="flex justify-between gap-3 px-5 py-2.5 hover:bg-accent/50"><span className="truncate"><span className="font-num">{p.article}</span> · {p.name}</span><span className="tabular-nums">{formatPrice(p.price)}</span></Link></li>)}</ul>
        </Card>
        <Card>
          <CardHeader><CardTitle>Користувачі ({customers.length})</CardTitle></CardHeader>
          <ul className="divide-y border-t text-sm">{customers.map((c) => <li key={c.id}><Link href={c.role === "CUSTOMER" ? `/admin/customers/${c.id}` : "/admin/users"} className="block px-5 py-2.5 hover:bg-accent/50">{c.name} · {c.email} · {c.phone}</Link></li>)}</ul>
        </Card>
        <Card>
          <CardHeader><CardTitle>VIN-запити ({vins.length})</CardTitle></CardHeader>
          <ul className="divide-y border-t text-sm">{vins.map((r) => <li key={r.id}><Link href={`/admin/vin-requests/${r.id}`} className="flex justify-between gap-3 px-5 py-2.5 hover:bg-accent/50"><span className="truncate">№{r.number} · <span className="font-num">{r.vin}</span></span><VinStatusBadge status={r.status} /></Link></li>)}</ul>
        </Card>
      </div>
    </div>
  );
}
