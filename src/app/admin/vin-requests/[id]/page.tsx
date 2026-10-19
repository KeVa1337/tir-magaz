import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetVinRequest } from "@/server/services/vinRequests";
import { getSettings } from "@/server/services/settings";
import { vehicleTitle } from "@/server/services/fitment";
import { AnswerForms, OeLinker, ProposalEditor } from "@/components/admin/vin-workbench";
import { SlaTimer } from "@/components/admin/widgets";
import { VinMessages } from "@/components/shared/vin-messages";
import { Breadcrumbs } from "@/components/shared/misc";
import { PartNumber } from "@/components/shared/part-number";
import { VinStatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatKm, toNumber } from "@/lib/format";
import { VEHICLE_KIND } from "@/lib/labels";

export default async function AdminVinRequestPage({ params }: PageProps<"/admin/vin-requests/[id]">) {
  const { id } = await params;
  const [r, settings] = await Promise.all([adminGetVinRequest(id), getSettings()]);
  if (!r) notFound();
  const v = r.vehicle;
  const linked = v?.oeNumbers.map((o) => o.oeNumber) ?? [];
  const items = r.items.map((i) => ({
    id: i.id, qty: i.qty, comment: i.comment,
    product: {
      id: i.product.id, name: i.product.name, article: i.product.article, articleNorm: i.product.articleNorm, brand: i.product.brand.name, price: toNumber(i.product.price), stockStatus: i.product.stockStatus,
      isOriginal: i.product.brand.isOriginal,
      oe: i.product.numbers.filter((n) => n.type === "OE").map((n) => ({ number: n.number, norm: n.numberNorm, brand: n.brandName })),
    },
  }));
  return (
    <div className="grid gap-6">
      <Breadcrumbs items={[{ label: "VIN-запити", href: "/admin/vin-requests" }, { label: `№${r.number}` }]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">VIN-запит №{r.number}</h1>
        <VinStatusBadge status={r.status} />
        <SlaTimer createdAt={r.createdAt.toISOString()} slaHours={settings.vin.slaHours} done={r.status === "ANSWERED" || r.status === "CLOSED"} />
        <span className="text-sm text-muted-foreground">{formatDateTime(r.createdAt)}{r.assignedTo ? ` · ${r.assignedTo.name}` : ""}</span>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader><CardTitle>Підбір: товари у відповідь</CardTitle></CardHeader>
            <CardContent><ProposalEditor requestId={r.id} items={items} vehicleId={v?.id ?? null} linked={linked} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Листування</CardTitle></CardHeader>
            <CardContent className="grid gap-5">
              <VinMessages messages={r.messages} viewer="staff" />
              <AnswerForms requestId={r.id} status={r.status} hasItems={items.length > 0} assigned={!!r.assignedToId} />
            </CardContent>
          </Card>
        </div>
        <aside className="grid content-start gap-6">
          <Card>
            <CardHeader><CardTitle>Клієнт</CardTitle></CardHeader>
            <CardContent className="grid gap-1 text-sm">
              {r.user ? (
                <>
                  <Link href={`/admin/customers/${r.user.id}`} className="font-semibold hover:underline">{r.user.name}</Link>
                  <a href={`tel:${r.user.phone}`} className="font-num">{r.user.phone}</a>
                  <span className="text-muted-foreground">{r.user.email}</span>
                </>
              ) : (
                <>
                  <span className="font-semibold">{r.guestName ?? "Гість"}</span>
                  <a href={`tel:${r.guestPhone}`} className="font-num">{r.guestPhone}</a>
                  <span className="text-xs text-muted-foreground">Гість без кабінету — відповідь телефоном/месенджером</span>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Авто</CardTitle></CardHeader>
            <CardContent className="grid gap-1.5 text-sm">
              {r.vin && <PartNumber value={r.vin} className="font-bold" />}
              {v ? (
                <dl className="grid gap-1">
                  {([
                    ["Тип", VEHICLE_KIND[v.kind]], ["Модель", vehicleTitle(v)], ["Рік", v.year], ["Шасі", v.chassisNumber], ["Євро", v.euroClass],
                    ["КПП", v.gearbox], ["Осі", v.axleBrand ?? v.axleConfig], ["Пробіг", v.mileageKm ? formatKm(v.mileageKm) : null], ["Держномер", v.plate],
                  ] as [string, unknown][]).filter(([, x]) => x).map(([k, x]) => (
                    <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-num font-semibold">{String(x)}</dd></div>
                  ))}
                </dl>
              ) : <p className="text-muted-foreground">Авто не з гаража — дані тільки з VIN.</p>}
              {r.vin && <Button asChild variant="outline" size="sm" className="mt-2"><Link href={`/vin?vin=${r.vin}`} target="_blank">Розшифрувати VIN</Link></Button>}
            </CardContent>
          </Card>
          {v && (
            <Card>
              <CardHeader><CardTitle>OE-номери авто</CardTitle><p className="text-xs text-muted-foreground">База «VIN → OE»: номери одразу працюють у підборі клієнта</p></CardHeader>
              <CardContent><OeLinker vehicleId={v.id} items={v.oeNumbers} /></CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
