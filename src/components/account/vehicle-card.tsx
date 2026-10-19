import Link from "next/link";
import type { VehicleKind } from "@prisma/client";
import { VehicleSilhouette } from "@/components/shared/icons";
import { Badge } from "@/components/ui/badge";
import { VEHICLE_KIND } from "@/lib/labels";
import { formatInt } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface VehicleCardData {
  id: string; kind: VehicleKind; nickname: string | null; vin: string | null; plate: string | null; year: number | null;
  mileageKm: number | null; euroClass: string | null; axleConfig: string | null; axleBrand: string | null; gearbox: string | null;
  make: { name: string } | null; series: { name: string } | null; engineCode: { code: string } | null;
  oeCount?: number; active?: boolean;
}

/** Картка авто у вигляді «технічного паспорта» (SPEC §11). */
export function VehicleCard({ v, href }: { v: VehicleCardData; href?: string }) {
  const title = [v.make?.name, v.series?.name].filter(Boolean).join(" ") || "Модель не вказана";
  const params: [string, string | null][] =
    v.kind === "TRAILER"
      ? [["Рік", v.year ? String(v.year) : null], ["Осі", v.axleBrand], ["К-сть осей", v.axleConfig], ["Держномер", v.plate]]
      : [["Рік", v.year ? String(v.year) : null], ["Двигун", v.engineCode?.code ?? null], ["Пробіг, км", v.mileageKm ? formatInt(v.mileageKm) : null], ["Євро", v.euroClass]];
  const body = (
    <div className={cn("group relative overflow-hidden rounded-xl border bg-card transition-all", href && "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg", v.active && "border-primary ring-1 ring-primary")}>
      <div className="bg-grid relative flex items-end justify-between gap-3 border-b px-4 pt-4 pb-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1.5">
            <Badge tone={v.kind === "TRAILER" ? "blue" : "outline"}>{VEHICLE_KIND[v.kind]}</Badge>
            {v.active && <Badge tone="primary">Активне</Badge>}
          </div>
          <p className="truncate text-lg font-extrabold">{v.nickname ?? title}</p>
          {v.nickname && <p className="truncate text-sm text-muted-foreground">{title}</p>}
        </div>
        <VehicleSilhouette kind={v.kind} className="h-12 w-28 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary" />
      </div>
      <dl className="grid grid-cols-4 divide-x">
        {params.map(([k, val]) => (
          <div key={k} className="min-w-0 px-3 py-2.5">
            <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{k}</dt>
            <dd className="truncate font-num text-sm font-semibold">{val ?? "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5 text-xs">
        <span className="truncate font-num text-muted-foreground">{v.vin ?? "VIN не вказано"}</span>
        {!!v.oeCount && <span className="shrink-0 font-semibold text-success">{v.oeCount} OE-номерів</span>}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}
