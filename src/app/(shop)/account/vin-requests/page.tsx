import Link from "next/link";
import { Plus, ScanLine } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { listUserVinRequests } from "@/server/services/vinRequests";
import { EmptyState, PageHeader } from "@/components/shared/misc";
import { VinStatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "VIN-запити" };

export default async function VinRequestsPage() {
  const user = await requireRole("CUSTOMER");
  const list = await listUserVinRequests(user.id);
  return (
    <>
      <PageHeader title="VIN-запити" description="Підбір деталей менеджером за VIN і номером шасі">
        <Button asChild><Link href="/account/vin-requests/new"><Plus /> Новий запит</Link></Button>
      </PageHeader>
      {list.length ? (
        <ul className="grid gap-3">
          {list.map((r) => (
            <li key={r.id}>
              <Link href={`/account/vin-requests/${r.number}`} className="grid gap-1 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold">№{r.number}</span>
                  <VinStatusBadge status={r.status} />
                  <span className="text-sm text-muted-foreground">{r.vehicle ? [r.vehicle.nickname, r.vehicle.make?.name, r.vehicle.series?.name].filter(Boolean).join(" · ") : r.vin}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{timeAgo(r.updatedAt)}</span>
                </div>
                <p className="line-clamp-2 text-sm">{r.message}</p>
                <p className="text-xs text-muted-foreground">{r._count.items ? `Запропоновано позицій: ${r._count.items}` : "Очікує на підбір"} · повідомлень: {r._count.messages}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={ScanLine} title="Запитів ще немає" text="Опишіть, які деталі потрібні — менеджер підбере їх за VIN і відповість тут.">
          <Button asChild><Link href="/account/vin-requests/new">Створити запит</Link></Button>
        </EmptyState>
      )}
    </>
  );
}
