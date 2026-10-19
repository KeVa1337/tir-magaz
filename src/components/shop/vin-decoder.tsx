"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Plus, ScanLine, Truck } from "lucide-react";
import { toast } from "sonner";
import { decodeVinAction, setVehicleContextAction } from "@/server/actions/shop";
import type { DecodedVin } from "@/server/vin/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PartNumber } from "@/components/shared/part-number";
import { VEHICLE_KIND } from "@/lib/labels";
import { cn } from "@/lib/utils";

const CONF = { high: { tone: "green", label: "висока" }, medium: { tone: "amber", label: "середня" }, low: { tone: "red", label: "низька" } } as const;

export function VinDecoder({ initialVin, loggedIn }: { initialVin?: string; loggedIn: boolean }) {
  const router = useRouter();
  const [vin, setVin] = React.useState(initialVin ?? "");
  const [res, setRes] = React.useState<DecodedVin | null>(null);
  const [pending, start] = React.useTransition();

  const decode = React.useCallback((value: string) => {
    if (!value.trim()) return;
    start(async () => setRes(await decodeVinAction(value)));
  }, []);

  React.useEffect(() => {
    if (initialVin) decode(initialVin);
  }, [initialVin, decode]);

  const clean = vin.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const addHref = `/account/garage/new?vin=${res?.vin ?? clean}`;

  return (
    <div className="grid gap-5">
      <form onSubmit={(e) => { e.preventDefault(); decode(vin); }} className="grid gap-2">
        <label htmlFor="vin-input" className="text-sm font-semibold">VIN (17 символів)</label>
        <div className="flex gap-2 max-sm:flex-col">
          <div className="relative flex-1">
            <ScanLine className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="vin-input"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              maxLength={24}
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="XLRTEH4300G123456"
              className="h-14 w-full rounded-xl border border-input bg-card pr-16 pl-12 font-num text-lg tracking-widest outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
            />
            <span className={cn("absolute top-1/2 right-4 -translate-y-1/2 font-num text-xs", clean.length === 17 ? "text-success" : "text-muted-foreground")}>{clean.length}/17</span>
          </div>
          <Button size="xl" type="submit" disabled={pending || !clean}>
            {pending ? <Loader2 className="animate-spin" /> : <ScanLine />} Розшифрувати
          </Button>
        </div>
      </form>

      {res && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="bg-grid flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary"><Truck className="size-6" /></span>
              <div>
                <p className="text-lg font-extrabold">{res.make ?? "Невідомий виробник"}{res.modelYear ? `, ${res.modelYear}` : ""}</p>
                <PartNumber value={res.vin} className="text-muted-foreground" />
              </div>
            </div>
            <Badge tone={CONF[res.confidence].tone}>Достовірність: {CONF[res.confidence].label}</Badge>
          </div>
          <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            {[
              ["WMI (виробник)", res.wmi || "—"],
              ["Тип", res.kind ? VEHICLE_KIND[res.kind] : "—"],
              ["Модельний рік", res.modelYearCandidates?.length ? res.modelYearCandidates.join(" / ") : "—"],
              ["Серійний № (шасі)", res.serial ?? "—"],
              ["VDS (опис моделі)", res.vds ?? "—"],
              ["Контрольний символ", res.checkDigit === "valid" ? "збігається" : res.checkDigit === "mismatch" ? "не збігається*" : "—"],
              ["Формат", res.valid ? "коректний" : "помилка"],
              ["Джерело", res.source === "local" ? "локальний декодер" : res.source],
            ].map(([k, v]) => (
              <div key={k} className="bg-card p-3">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 font-num text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          {(res.issues.length > 0 || res.checkDigit === "mismatch") && (
            <div className="grid gap-1 border-t bg-warning/5 p-4 text-sm">
              {res.issues.map((i) => <p key={i} className="flex items-center gap-2 text-warning"><AlertTriangle className="size-4" /> {i}</p>)}
              {res.checkDigit === "mismatch" && <p className="text-muted-foreground">* Європейські виробники вантажівок часто не використовують контрольний символ — це не помилка VIN.</p>}
            </div>
          )}
          {res.valid && res.makeId && (
            <div className="flex items-center gap-2 border-t bg-success/5 p-4 text-sm text-success">
              <CheckCircle2 className="size-4" /> Марку визначено. Серію, двигун і осі уточніть у формі гаража — або надішліть запит менеджеру.
            </div>
          )}
          <div className="flex flex-wrap gap-2 border-t p-4">
            <Button asChild>
              <Link href={loggedIn ? addHref : `/login?callbackUrl=${encodeURIComponent(addHref)}`}><Plus /> Додати в гараж</Link>
            </Button>
            {res.makeId && (
              <Button variant="outline" onClick={async () => {
                await setVehicleContextAction(`q:${res.makeId}:::${res.modelYear ?? ""}`);
                toast.success(`Підбір під ${res.make}`);
                router.push("/catalog?fit=1");
              }}>
                Показати деталі для {res.make}
              </Button>
            )}
            <Button asChild variant="ghost"><a href="#vin-request">Запит менеджеру ↓</a></Button>
          </div>
        </div>
      )}
    </div>
  );
}
