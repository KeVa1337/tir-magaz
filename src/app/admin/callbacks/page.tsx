import Link from "next/link";
import { PhoneCall, Zap } from "lucide-react";
import { adminListCallbacks } from "@/server/services/callbacks";
import { db } from "@/server/db";
import { CallbackStatusButton } from "@/components/admin/callback-actions";
import { PageHeader } from "@/components/shared/misc";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, timeAgo } from "@/lib/format";
import { first, type SP } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata = { title: "Дзвінки і швидкі замовлення" };

export default async function CallbacksPage({ searchParams }: PageProps<"/admin/callbacks">) {
  const sp = (await searchParams) as SP;
  const status = first(sp.status) === "DONE" ? "DONE" : first(sp.status) === "all" ? undefined : "NEW";
  const list = await adminListCallbacks(status);
  const orders = await db.order.findMany({ where: { id: { in: list.map((c) => c.orderId).filter((x): x is string => !!x) } }, select: { id: true, number: true } });
  const tab = (key: string, label: string, active: boolean) => (
    <Link key={key} href={`/admin/callbacks?status=${key}`} className={cn("rounded-md border px-3 py-1.5 text-sm font-semibold", active ? "border-primary bg-primary/10" : "hover:bg-accent")}>{label}</Link>
  );
  return (
    <div className="grid gap-4">
      <PageHeader title="Дзвінки і швидкі замовлення" description="Заявки «Передзвоніть мені» та «Купити в 1 клік»" className="mb-0" />
      <div className="flex gap-1">{tab("NEW", "Нові", status === "NEW")}{tab("DONE", "Опрацьовані", status === "DONE")}{tab("all", "Усі", !status)}</div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-xs text-muted-foreground uppercase"><tr>{["Коли", "Тип", "Клієнт", "Що потрібно", ""].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {list.map((c) => {
              const order = orders.find((o) => o.id === c.orderId);
              return (
                <tr key={c.id} className={cn("border-b align-top last:border-0", c.status === "DONE" && "opacity-60")}>
                  <td className="px-3 py-2.5 whitespace-nowrap"><span className="block font-semibold">{timeAgo(c.createdAt)}</span><span className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</span></td>
                  <td className="px-3 py-2.5">{c.kind === "quick-order" ? <Badge tone="primary"><Zap /> В 1 клік</Badge> : <Badge tone="blue"><PhoneCall /> Дзвінок</Badge>}</td>
                  <td className="px-3 py-2.5"><span className="block font-semibold">{c.name ?? "—"}</span><a href={`tel:${c.phone}`} className="font-num text-xs">{c.phone}</a></td>
                  <td className="max-w-md px-3 py-2.5">
                    {c.comment && <p>{c.comment}</p>}
                    {c.product && <Link href={`/product/${c.product.slug}`} target="_blank" className="text-xs text-info hover:underline">{c.product.name} · {c.product.article}</Link>}
                    {order && <Link href={`/admin/orders/${order.id}`} className="block text-xs font-semibold hover:underline">Замовлення №{order.number} →</Link>}
                  </td>
                  <td className="px-3 py-2.5 text-right"><CallbackStatusButton id={c.id} done={c.status === "DONE"} /></td>
                </tr>
              );
            })}
            {!list.length && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Заявок немає</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
