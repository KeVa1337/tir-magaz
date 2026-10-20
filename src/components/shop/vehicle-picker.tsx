"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Container, Loader2, Truck } from "lucide-react";
import { setVehicleContextAction } from "@/server/actions/shop";
import type { DirectoryMake } from "./vehicle-switcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Підбір без реєстрації: марка → серія → двигун → рік, далі каталог під цю модель. */
export function VehiclePicker({ directory }: { directory: DirectoryMake[] }) {
  const router = useRouter();
  const [makeId, setMakeId] = React.useState<string | null>(null);
  const [seriesId, setSeriesId] = React.useState<string | null>(null);
  const [engineId, setEngineId] = React.useState<string | null>(null);
  const [year, setYear] = React.useState<number | null>(null);
  const [pending, start] = React.useTransition();

  const make = directory.find((m) => m.id === makeId);
  const series = make?.series.find((s) => s.id === seriesId);
  const years = series ? range(series.yearFrom ?? 1995, series.yearTo ?? new Date().getFullYear()) : [];
  const needEngine = !!series?.engines.length;
  const ready = !!make && (!make.series.length || !!series) && (!needEngine || !!engineId);

  const go = (to: string) =>
    start(async () => {
      await setVehicleContextAction(`q:${makeId}:${seriesId ?? ""}:${engineId ?? ""}:${year ?? ""}`);
      router.push(to);
    });

  const col = "grid content-start gap-1.5 rounded-xl border bg-card p-3";
  const item = (active: boolean) => cn("flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-3 text-left text-sm font-semibold transition-colors", active ? "bg-primary text-primary-foreground" : "hover:bg-accent");

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className={col}>
          <p className="px-2 pb-1 text-xs font-bold text-muted-foreground uppercase">1 · Марка</p>
          {directory.map((m) => (
            <button key={m.id} className={item(m.id === makeId)} onClick={() => { setMakeId(m.id); setSeriesId(null); setEngineId(null); setYear(null); }}>
              <span className="flex items-center gap-2">{m.kind === "TRAILER" ? <Container className="size-4" /> : <Truck className="size-4" />}{m.name}</span>
              <ChevronRight className="size-4 opacity-50" />
            </button>
          ))}
        </div>
        <div className={col}>
          <p className="px-2 pb-1 text-xs font-bold text-muted-foreground uppercase">2 · Серія</p>
          {make ? make.series.map((s) => (
            <button key={s.id} className={item(s.id === seriesId)} onClick={() => { setSeriesId(s.id); setEngineId(null); setYear(null); }}>
              <span>{s.name}<span className="block text-xs font-normal opacity-70">{s.yearFrom ?? "…"}–{s.yearTo ?? "н.ч."}</span></span>
              <ChevronRight className="size-4 opacity-50" />
            </button>
          )) : <p className="px-2 py-3 text-sm text-muted-foreground">Оберіть марку</p>}
        </div>
        <div className={col}>
          <p className="px-2 pb-1 text-xs font-bold text-muted-foreground uppercase">3 · Двигун</p>
          {series ? (needEngine ? series.engines.map((e) => (
            <button key={e.id} className={item(e.id === engineId)} onClick={() => setEngineId(e.id)}>
              <span className="font-num">{e.code}<span className="block font-sans text-xs font-normal opacity-70">{e.euroClass}</span></span>
              {e.id === engineId && <Check className="size-4" />}
            </button>
          )) : <p className="px-2 py-3 text-sm text-muted-foreground">Для причепа двигун не потрібен</p>) : <p className="px-2 py-3 text-sm text-muted-foreground">Оберіть серію</p>}
        </div>
        <div className={col}>
          <p className="px-2 pb-1 text-xs font-bold text-muted-foreground uppercase">4 · Рік (необов&apos;язково)</p>
          {series ? (
            <div className="grid grid-cols-3 gap-1">
              {years.map((y) => (
                <button key={y} className={cn("cursor-pointer rounded-md py-2 font-num text-sm", y === year ? "bg-primary text-primary-foreground" : "hover:bg-accent")} onClick={() => setYear(y === year ? null : y)}>{y}</button>
              ))}
            </div>
          ) : <p className="px-2 py-3 text-sm text-muted-foreground">Оберіть серію</p>}
        </div>
      </div>
      <div className="sticky bottom-36 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/50 bg-popover p-4 shadow-xl sm:bottom-4">
        <p className="text-sm">
          {make ? <b>{[make.name, series?.name, series?.engines.find((e) => e.id === engineId)?.code, year].filter(Boolean).join(" · ")}</b> : "Оберіть марку, серію і двигун"}
          {make && !ready && <span className="text-muted-foreground"> — оберіть {!series ? "серію" : "двигун"}</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!ready || pending} onClick={() => go("/schemes")}>Схеми вузлів</Button>
          <Button disabled={!ready || pending} onClick={() => go("/catalog?fit=1")}>{pending && <Loader2 className="animate-spin" />} Показати деталі</Button>
        </div>
      </div>
    </div>
  );
}

function range(a: number, b: number) {
  const out: number[] = [];
  for (let y = Math.min(b, new Date().getFullYear()); y >= a; y--) out.push(y);
  return out;
}
