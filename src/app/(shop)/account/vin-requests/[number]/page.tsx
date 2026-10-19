import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { getUserVinRequest } from "@/server/services/vinRequests";
import { closeVinRequestAction } from "@/server/actions/account";
import { vehicleTitle } from "@/server/services/fitment";
import { Breadcrumbs } from "@/components/shared/misc";
import { PartNumber } from "@/components/shared/part-number";
import { VinStatusBadge } from "@/components/shared/status";
import { VinMessages } from "@/components/shared/vin-messages";
import { MessageForm, ProposedItems } from "@/components/account/vin-thread";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, toNumber } from "@/lib/format";
import { first, type SP } from "@/lib/search-params";

export default async function VinRequestPage({ params, searchParams }: PageProps<"/account/vin-requests/[number]">) {
  const { number } = await params;
  const sp = (await searchParams) as SP;
  const user = await requireRole("CUSTOMER");
  const r = await getUserVinRequest(user.id, Number(number));
  if (!r) notFound();
  const items = r.items.map((i) => ({
    id: i.id, qty: i.qty, comment: i.comment,
    product: { slug: i.product.slug, name: i.product.name, article: i.product.article, brand: i.product.brand.name, price: toNumber(i.product.price), stockStatus: i.product.stockStatus, leadTimeDays: i.product.leadTimeDays, isActive: i.product.isActive },
  }));
  const close = closeVinRequestAction.bind(null, r.id);

  return (
    <>
      <Breadcrumbs items={[{ label: "VIN-запити", href: "/account/vin-requests" }, { label: `№${r.number}` }]} />
      {first(sp.created) && (
        <p className="mb-4 flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 p-4 font-semibold"><CheckCircle2 className="size-5 text-success" /> Запит надіслано. Ми повідомимо, щойно менеджер відповість.</p>
      )}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold sm:text-3xl">VIN-запит №{r.number}</h1>
        <VinStatusBadge status={r.status} />
        <span className="text-sm text-muted-foreground">{formatDateTime(r.createdAt)}</span>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-6">
          {items.length > 0 && <ProposedItems requestId={r.id} items={items} />}
          <Card>
            <CardHeader><CardTitle>Листування</CardTitle></CardHeader>
            <CardContent className="grid gap-5">
              <VinMessages messages={r.messages} viewer="customer" />
              {r.status !== "CLOSED" ? <MessageForm requestId={r.id} /> : <p className="text-sm text-muted-foreground">Запит закрито. Напишіть повідомлення в новому запиті, якщо потрібно.</p>}
            </CardContent>
          </Card>
        </div>
        <aside className="grid content-start gap-4">
          <Card>
            <CardHeader><CardTitle>Авто</CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {r.vehicle ? <Link href={`/account/garage/${r.vehicle.id}`} className="font-semibold hover:underline">{r.vehicle.nickname ?? vehicleTitle(r.vehicle)}</Link> : <span>Авто не з гаража</span>}
              {r.vin && <PartNumber value={r.vin} />}
              {r.vehicle && r.vehicle.oeNumbers.length > 0 && <p className="text-xs text-success">Збережено OE-номерів: {r.vehicle.oeNumbers.length}</p>}
              {r.assignedTo && <p className="text-muted-foreground">Менеджер: {r.assignedTo.name}</p>}
            </CardContent>
          </Card>
          {r.status !== "CLOSED" && (
            <form action={close}><Button variant="outline" className="w-full">Закрити запит</Button></form>
          )}
        </aside>
      </div>
    </>
  );
}
