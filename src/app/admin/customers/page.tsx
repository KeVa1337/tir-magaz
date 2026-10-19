import Link from "next/link";
import { adminListCustomers } from "@/server/services/users";
import { PageHeader, Pagination } from "@/components/shared/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { formatDate, formatPrice, toNumber } from "@/lib/format";
import { first, toQuery, type SP } from "@/lib/search-params";

export const metadata = { title: "Клієнти" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const sp = (await searchParams) as SP;
  const res = await adminListCustomers(first(sp.q), Number(first(sp.page)) || 1);
  return (
    <div className="grid gap-4">
      <PageHeader title="Клієнти" description={`Усього: ${res.total}`} className="mb-0" />
      <form><Input name="q" defaultValue={first(sp.q)} placeholder="Ім'я, email, телефон, VIN або держномер" className="h-9 max-w-sm" aria-label="Пошук клієнтів" /></form>
      <div className="rounded-xl border bg-card">
        <Table>
          <THead><TR><TH>Клієнт</TH><TH>Контакти</TH><TH className="text-right">Авто</TH><TH className="text-right">Замовлень</TH><TH className="text-right">Сума покупок</TH><TH className="text-right">VIN-запитів</TH><TH>З нами з</TH></TR></THead>
          <TBody>
            {res.items.map((c) => (
              <TR key={c.id}>
                <TD><Link href={`/admin/customers/${c.id}`} className="font-semibold hover:underline">{c.name ?? "Без імені"}</Link>{c.managerNote && <span className="block max-w-56 truncate text-xs text-muted-foreground">📝 {c.managerNote}</span>}</TD>
                <TD className="text-xs"><span className="block">{c.email}</span><span className="font-num text-muted-foreground">{c.phone}</span></TD>
                <TD className="text-right tabular-nums">{c._count.vehicles}</TD>
                <TD className="text-right tabular-nums">{c._count.orders}</TD>
                <TD className="text-right font-semibold tabular-nums">{formatPrice(c.orders.reduce((s, o) => s + toNumber(o.total), 0))}</TD>
                <TD className="text-right tabular-nums">{c._count.vinRequests}</TD>
                <TD className="text-muted-foreground">{formatDate(c.createdAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
      <Pagination page={res.page} pages={Math.ceil(res.total / res.perPage)} makeHref={(p) => `/admin/customers${toQuery(sp, { page: String(p) })}`} />
    </div>
  );
}
