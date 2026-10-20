import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { adminListOrders } from "@/server/services/orders";
import { PageHeader, Pagination } from "@/components/shared/misc";
import { OrderStatusBadge } from "@/components/shared/status";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatPrice } from "@/lib/format";
import { deliveryLabel, ORDER_STATUS, paymentLabel } from "@/lib/labels";
import { first, toQuery, type SP } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata = { title: "Замовлення" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = (await searchParams) as SP;
  const status = first(sp.status) as OrderStatus | undefined;
  const res = await adminListOrders({ status: status && status in ORDER_STATUS ? status : undefined, q: first(sp.q), from: first(sp.from), to: first(sp.to), page: Number(first(sp.page)) || 1 });
  const all = Object.values(res.counts).reduce((s, n) => s + (n ?? 0), 0);
  return (
    <div className="grid gap-4">
      <PageHeader title="Замовлення" description={`Усього: ${all}`} className="mb-0" />
      <div className="scrollbar-none flex gap-1 overflow-x-auto">
        <Link href="/admin/orders" className={cn("rounded-md border px-3 py-1.5 text-sm font-semibold whitespace-nowrap", !status ? "border-primary bg-primary/10" : "hover:bg-accent")}>Усі <span className="text-muted-foreground">{all}</span></Link>
        {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={cn("rounded-md border px-3 py-1.5 text-sm font-semibold whitespace-nowrap", status === s ? "border-primary bg-primary/10" : "hover:bg-accent")}>
            {ORDER_STATUS[s].label} <span className="text-muted-foreground">{res.counts[s] ?? 0}</span>
          </Link>
        ))}
      </div>
      <form className="flex flex-wrap items-end gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <Input name="q" defaultValue={first(sp.q)} placeholder="№, ім'я, телефон, email" className="h-9 w-64" aria-label="Пошук" />
        <label className="grid gap-1 text-xs text-muted-foreground">Від<Input type="date" name="from" defaultValue={first(sp.from)} className="h-9 w-40" /></label>
        <label className="grid gap-1 text-xs text-muted-foreground">До<Input type="date" name="to" defaultValue={first(sp.to)} className="h-9 w-40" /></label>
        <Button size="sm" className="h-9" variant="secondary">Фільтрувати</Button>
      </form>
      <div className="rounded-xl border bg-card">
        <Table>
          <THead><TR><TH>№</TH><TH>Дата</TH><TH>Клієнт</TH><TH>Доставка / оплата</TH><TH className="text-right">Поз.</TH><TH className="text-right">Сума</TH><TH>Статус</TH></TR></THead>
          <TBody>
            {res.items.map((o) => (
              <TR key={o.id} className="cursor-pointer">
                <TD><Link href={`/admin/orders/${o.id}`} className="font-num font-bold hover:underline">{o.number}</Link></TD>
                <TD className="whitespace-nowrap text-muted-foreground">{formatDateTime(o.createdAt)}</TD>
                <TD><span className="font-semibold">{o.contactName}</span>{!o.userId && <span className="ml-1 text-xs text-muted-foreground">(гість)</span>}<span className="block font-num text-xs text-muted-foreground">{o.contactPhone}</span></TD>
                <TD className="text-xs">{deliveryLabel(o.deliveryMethod)}{o.deliveryCity ? `, ${o.deliveryCity}` : ""}<span className="block text-muted-foreground">{paymentLabel(o.paymentMethod)}</span></TD>
                <TD className="text-right tabular-nums">{o.items.reduce((s, i) => s + i.qty, 0)}</TD>
                <TD className="text-right font-semibold whitespace-nowrap tabular-nums">{formatPrice(o.total)}</TD>
                <TD><OrderStatusBadge status={o.status} /></TD>
              </TR>
            ))}
            {!res.items.length && <TR><TD colSpan={7} className="py-8 text-center text-muted-foreground">Замовлень не знайдено</TD></TR>}
          </TBody>
        </Table>
      </div>
      <Pagination page={res.page} pages={Math.ceil(res.total / res.perPage)} makeHref={(p) => `/admin/orders${toQuery(sp, { page: String(p) })}`} />
    </div>
  );
}
