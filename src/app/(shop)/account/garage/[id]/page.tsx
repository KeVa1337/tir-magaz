import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, History, MessageSquareText, Pencil, ScanLine, Wrench } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { getVehicle, kitsForVehicle, serviceStatus } from "@/server/services/garage";
import { getVehiclePurchaseHistory } from "@/server/services/orders";
import { getShopContext } from "@/server/context";
import { db } from "@/server/db";
import { VehicleCard } from "@/components/account/vehicle-card";
import { DeleteVehicleButton, MileageEditor, UseVehicleButton } from "@/components/account/vehicle-actions";
import { Breadcrumbs, EmptyState } from "@/components/shared/misc";
import { PartNumber } from "@/components/shared/part-number";
import { OrderStatusBadge, VinStatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatKm, formatPrice, toNumber } from "@/lib/format";
import { VEHICLE_KIND } from "@/lib/labels";
import { first, type SP } from "@/lib/search-params";
import { vehicleTitle } from "@/server/services/fitment";

export default async function VehiclePage({ params, searchParams }: PageProps<"/account/garage/[id]">) {
  const { id } = await params;
  const sp = (await searchParams) as SP;
  const user = await requireRole("CUSTOMER");
  const v = await getVehicle(user.id, id);
  if (!v) notFound();
  const [history, kits, requests, { ctx }] = await Promise.all([
    getVehiclePurchaseHistory(v.id),
    kitsForVehicle(v),
    db.vinRequest.findMany({ where: { vehicleId: v.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    getShopContext(),
  ]);
  const name = v.nickname ?? vehicleTitle(v);
  const service = serviceStatus(v, kits[0]?.intervalKm ?? undefined);
  const spec: [string, string | null | undefined][] = [
    ["Тип", VEHICLE_KIND[v.kind]], ["Марка", v.make?.name], ["Серія", v.series?.name], ["Двигун", v.engineCode?.code],
    ["Рік", v.year ? String(v.year) : null], ["Номер шасі", v.chassisNumber], ["Євро", v.euroClass], ["КПП", v.gearbox],
    ["Колісна формула / осі", v.axleConfig], ["Кабіна", v.cabType], ["Марка осей", v.axleBrand], ["Держномер", v.plate],
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "Гараж", href: "/account/garage" }, { label: name }]} />
      {first(sp.created) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/10 p-4">
          <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5 text-success" /> Авто додано в гараж і вибрано для підбору.</p>
          <Button asChild variant="outline"><Link href={`/account/vin-requests/new?vehicle=${v.id}`}>Надіслати менеджеру для точного підбору</Link></Button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-6">
          <VehicleCard v={{ ...v, oeCount: v.oeNumbers.length, active: ctx?.vehicleId === v.id }} />
          <div className="flex flex-wrap gap-2">
            <UseVehicleButton vehicleId={v.id} />
            <Button asChild variant="outline"><Link href={`/account/vin-requests/new?vehicle=${v.id}`}><MessageSquareText /> Запит менеджеру</Link></Button>
            <Button asChild variant="ghost"><Link href={`/account/garage/${v.id}/edit`}><Pencil /> Редагувати</Link></Button>
            <DeleteVehicleButton vehicleId={v.id} name={name} />
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><ScanLine className="size-5 text-primary" /> OE-номери для цього авто</CardTitle>
              <span className="text-xs text-muted-foreground">від менеджера · працюють у підборі</span>
            </CardHeader>
            <CardContent>
              {v.oeNumbers.length ? (
                <ul className="divide-y rounded-lg border">
                  {v.oeNumbers.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                      <span>
                        <span className="block text-sm font-semibold">{o.label ?? "Без опису"}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(o.createdAt)}{o.addedBy?.name ? ` · ${o.addedBy.name}` : ""}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <PartNumber value={o.oeNumber} />
                        <Button asChild size="sm" variant="secondary"><Link href={`/search?q=${o.oeNumber}`}>Знайти</Link></Button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Поки немає. Надішліть VIN-запит — менеджер підбере деталі й збереже номери тут, і каталог почне їх враховувати.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><History className="size-5 text-primary" /> Історія покупок</CardTitle></CardHeader>
            <CardContent>
              {history.length ? (
                <ol className="relative grid gap-5 border-l pl-5">
                  {history.map((o) => (
                    <li key={o.id} className="relative">
                      <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-primary" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/account/orders/${o.number}`} className="font-bold hover:underline">№{o.number}</Link>
                        <span className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</span>
                        {o.mileageKm && <span className="font-num text-xs text-muted-foreground">пробіг {formatKm(o.mileageKm)}</span>}
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <ul className="mt-1.5 grid gap-0.5 text-sm">
                        {o.items.map((i) => (
                          <li key={i.id} className="flex justify-between gap-3">
                            <span className="truncate">{i.product ? <Link href={`/product/${i.product.slug}`} className="hover:underline">{i.name}</Link> : i.name} <span className="text-muted-foreground">× {i.qty}</span></span>
                            <span className="shrink-0 text-muted-foreground tabular-nums">{formatPrice(toNumber(i.price) * i.qty)}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState title="Ще не було покупок" text="Під час оформлення замовлення оберіть це авто — і покупки з'являться тут разом із пробігом." className="py-8" />
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="grid content-start gap-6">
          <Card>
            <CardHeader><CardTitle>Дані авто</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3 border-b pb-2"><dt className="text-muted-foreground">Пробіг</dt><dd><MileageEditor vehicleId={v.id} mileage={v.mileageKm} /></dd></div>
                {spec.filter(([, val]) => val).map(([k, val]) => (
                  <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-num font-semibold">{val}</dd></div>
                ))}
                {v.vin && <div className="mt-2 border-t pt-2"><dt className="text-muted-foreground">VIN</dt><dd><PartNumber value={v.vin} /></dd></div>}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="size-5 text-primary" /> Наступне ТО</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {service ? (
                <div className="mb-2 grid gap-2">
                  <p className="text-sm">
                    {service.left > 0 ? <>Через <b className="font-num">{formatKm(service.left)}</b></> : <b className="text-danger">Прострочено на {formatKm(-service.left)}</b>}
                    <span className="text-muted-foreground"> · на {formatKm(service.next)}</span>
                  </p>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(service.done * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Пробіг до ТО">
                    <div className={service.due ? "h-full bg-danger" : "h-full bg-primary"} style={{ width: `${Math.round(service.done * 100)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">Інтервал {formatKm(service.intervalKm)} · оновіть пробіг, щоб нагадування було точним</p>
                </div>
              ) : (
                <p className="mb-2 text-sm text-muted-foreground"><Link href={`/account/garage/${v.id}/edit`} className="underline">Вкажіть пробіг на останньому ТО</Link> — нагадаємо про наступне.</p>
              )}
              {kits.length ? kits.map((k) => (
                <Link key={k.id} href={`/kits/${k.slug}`} className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:border-primary/50">
                  <span className="text-sm font-semibold">{k.name}</span>
                  <span className="text-sm font-bold tabular-nums">{formatPrice(k.items.reduce((s, i) => s + toNumber(i.product.price) * i.qty, 0))}</span>
                </Link>
              )) : <p className="text-sm text-muted-foreground">Для цієї моделі комплектів ще немає — <Link href={`/account/vin-requests/new?vehicle=${v.id}`} className="underline">запитайте менеджера</Link>.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>VIN-запити</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {requests.length ? requests.map((r) => (
                <Link key={r.id} href={`/account/vin-requests/${r.number}`} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm hover:border-primary/50">
                  <span className="min-w-0"><span className="block truncate font-semibold">№{r.number} · {r.message}</span><span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span></span>
                  <VinStatusBadge status={r.status} />
                </Link>
              )) : <p className="text-sm text-muted-foreground">Запитів ще не було.</p>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
