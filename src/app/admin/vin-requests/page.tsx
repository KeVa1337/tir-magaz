import Link from "next/link";
import type { VinRequestStatus } from "@prisma/client";
import { adminListVinRequests } from "@/server/services/vinRequests";
import { getSettings } from "@/server/services/settings";
import { vehicleTitle } from "@/server/services/fitment";
import { getSessionUser } from "@/server/auth/guards";
import { SlaTimer } from "@/components/admin/widgets";
import { PageHeader } from "@/components/shared/misc";
import { VinStatusBadge } from "@/components/shared/status";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import { VIN_STATUS } from "@/lib/labels";
import { first, type SP } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata = { title: "VIN-запити" };

export default async function AdminVinPage({ searchParams }: PageProps<"/admin/vin-requests">) {
  const sp = (await searchParams) as SP;
  const status = first(sp.status) as VinRequestStatus | undefined;
  const me = await getSessionUser();
  const mine = first(sp.mine) === "1";
  const [res, settings] = await Promise.all([
    adminListVinRequests({ status: status && status in VIN_STATUS ? status : undefined, mine: mine ? me?.id : undefined, q: first(sp.q) }),
    getSettings(),
  ]);
  const tab = (href: string, label: string, active: boolean, count?: number) => (
    <Link key={href} href={href} className={cn("rounded-md border px-3 py-1.5 text-sm font-semibold whitespace-nowrap", active ? "border-primary bg-primary/10" : "hover:bg-accent")}>{label}{count != null && <span className="ml-1 text-muted-foreground">{count}</span>}</Link>
  );
  return (
    <div className="grid gap-4">
      <PageHeader title="VIN-запити" description={`SLA відповіді: ${settings.vin.slaHours} год`} className="mb-0" />
      <div className="scrollbar-none flex gap-1 overflow-x-auto">
        {tab("/admin/vin-requests", "Черга (нові + в роботі)", !status && !mine, (res.counts.NEW ?? 0) + (res.counts.IN_PROGRESS ?? 0))}
        {tab("/admin/vin-requests?mine=1", "Мої", mine)}
        {(Object.keys(VIN_STATUS) as VinRequestStatus[]).map((s) => tab(`/admin/vin-requests?status=${s}`, VIN_STATUS[s].label, status === s, res.counts[s] ?? 0))}
      </div>
      <form><Input name="q" defaultValue={first(sp.q)} placeholder="VIN, текст, телефон, клієнт" className="h-9 max-w-sm" aria-label="Пошук" /></form>
      <div className="rounded-xl border bg-card">
        <Table>
          <THead><TR><TH>№</TH><TH>Створено</TH><TH>SLA</TH><TH>Клієнт</TH><TH>Авто / VIN</TH><TH>Запит</TH><TH>Менеджер</TH><TH>Статус</TH></TR></THead>
          <TBody>
            {res.items.map((r) => (
              <TR key={r.id}>
                <TD><Link href={`/admin/vin-requests/${r.id}`} className="font-num font-bold hover:underline">{r.number}</Link></TD>
                <TD className="whitespace-nowrap text-muted-foreground">{formatDateTime(r.createdAt)}</TD>
                <TD><SlaTimer createdAt={r.createdAt.toISOString()} slaHours={settings.vin.slaHours} done={r.status === "ANSWERED" || r.status === "CLOSED"} /></TD>
                <TD>{r.user?.name ?? <>{r.guestName ?? "Гість"} <span className="block font-num text-xs text-muted-foreground">{r.guestPhone}</span></>}</TD>
                <TD className="max-w-48"><span className="block truncate">{r.vehicle ? vehicleTitle(r.vehicle) : "—"}</span><span className="font-num text-xs text-muted-foreground">{r.vin}</span></TD>
                <TD className="max-w-72"><Link href={`/admin/vin-requests/${r.id}`} className="line-clamp-2 hover:underline">{r.message}</Link></TD>
                <TD className="text-muted-foreground">{r.assignedTo?.name ?? "—"}</TD>
                <TD><VinStatusBadge status={r.status} /></TD>
              </TR>
            ))}
            {!res.items.length && <TR><TD colSpan={8} className="py-8 text-center text-muted-foreground">Запитів немає</TD></TR>}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
