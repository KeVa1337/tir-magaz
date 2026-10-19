import Link from "next/link";
import { AlertTriangle, ClipboardList, ImageOff, ScanLine, TrendingUp, Users } from "lucide-react";
import { dashboardStats } from "@/server/services/admin/dashboard";
import { getSettings } from "@/server/services/settings";
import { SalesChart, SlaTimer } from "@/components/admin/widgets";
import { OrderStatusBadge } from "@/components/shared/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatPrice, timeAgo } from "@/lib/format";
import { vehicleTitle } from "@/server/services/fitment";

export const metadata = { title: "Дашборд" };

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const denied = !!(await searchParams).denied;
  const [s, settings] = await Promise.all([dashboardStats(30), getSettings()]);
  const tiles = [
    { label: "Нові замовлення", value: String(s.newOrders), href: "/admin/orders?status=NEW", icon: ClipboardList, accent: s.newOrders > 0 },
    { label: "VIN-запити в черзі", value: String(s.vinQueue.length), href: "/admin/vin-requests", icon: ScanLine, accent: s.vinQueue.length > 0 },
    { label: "Виручка за 30 днів", value: formatPrice(s.sales.revenue), sub: `${s.sales.count} замовлень · середній чек ${formatPrice(Math.round(s.sales.avg))}`, icon: TrendingUp },
    { label: "Нові клієнти за 30 днів", value: String(s.newCustomers), href: "/admin/customers", icon: Users },
  ];
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-extrabold">Дашборд</h1>
      {denied && <p role="alert" className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">Цей розділ доступний лише адміністратору.</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => {
          const body = (
            <Card className={t.accent ? "border-primary/50" : undefined}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between text-sm text-muted-foreground">{t.label}<t.icon className="size-4" /></div>
                <p className="mt-2 text-3xl font-extrabold tabular-nums">{t.value}</p>
                {t.sub && <p className="mt-1 text-xs text-muted-foreground">{t.sub}</p>}
              </CardContent>
            </Card>
          );
          return t.href ? <Link key={t.label} href={t.href} className="block transition-transform hover:-translate-y-0.5">{body}</Link> : <div key={t.label}>{body}</div>;
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Виручка по днях, ₴</CardTitle><p className="text-sm text-muted-foreground">Останні 30 днів, без скасованих</p></CardHeader>
          <CardContent><SalesChart data={s.sales.series} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>VIN-запити в очікуванні</CardTitle><Link href="/admin/vin-requests" className="text-sm text-muted-foreground hover:text-foreground">Черга →</Link></CardHeader>
          <ul className="divide-y border-t">
            {s.vinQueue.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/vin-requests/${r.id}`} className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-accent/50">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">№{r.number} · {r.user?.name ?? r.guestName ?? "Гість"}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.vehicle ? vehicleTitle(r.vehicle) : r.vin} · {r.message}</span>
                  </span>
                  <SlaTimer createdAt={r.createdAt.toISOString()} slaHours={settings.vin.slaHours} />
                </Link>
              </li>
            ))}
            {!s.vinQueue.length && <li className="px-5 py-4 text-sm text-muted-foreground">Черга порожня 👌</li>}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Останні замовлення</CardTitle><Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">Усі →</Link></CardHeader>
          <ul className="divide-y border-t">
            {s.recentOrders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-2.5 text-sm hover:bg-accent/50">
                  <span className="font-num font-bold">№{o.number}</span>
                  <span className="truncate">{o.contactName} <span className="text-muted-foreground">· {timeAgo(o.createdAt)}</span></span>
                  <span className="flex items-center gap-3"><span className="font-semibold tabular-nums">{formatPrice(o.total)}</span><OrderStatusBadge status={o.status} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader><CardTitle>Якість каталогу</CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <Link href="/admin/products?flag=nophoto" className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"><span className="flex items-center gap-2"><ImageOff className="size-4 text-warning" /> Без фото</span><b className="tabular-nums">{s.noPhoto}</b></Link>
              <Link href="/admin/products?flag=noprice" className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"><span className="flex items-center gap-2"><AlertTriangle className="size-4 text-danger" /> Без ціни</span><b className="tabular-nums">{s.noPrice}</b></Link>
              <Link href="/admin/products?flag=nofit" className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"><span className="flex items-center gap-2"><AlertTriangle className="size-4 text-warning" /> Без застосовності</span><span className="text-muted-foreground">переглянути</span></Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between"><CardTitle>Останні імпорти</CardTitle><Link href="/admin/import" className="text-sm text-muted-foreground hover:text-foreground">Імпорт →</Link></CardHeader>
            <ul className="divide-y border-t text-sm">
              {s.imports.map((j) => (
                <li key={j.id} className="px-5 py-2.5">
                  <p className="truncate font-semibold">{j.fileName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(j.createdAt)} · {j.byUser.name} · +{j.created} / ↻{j.updated}{Array.isArray(j.errors) && j.errors.length ? ` · помилок: ${j.errors.length}` : ""}</p>
                </li>
              ))}
              {!s.imports.length && <li className="px-5 py-3 text-muted-foreground">Імпортів ще не було</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
