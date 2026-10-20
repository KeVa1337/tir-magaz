"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Plus, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { setVehicleContextAction } from "@/server/actions/shop";
import { cn } from "@/lib/utils";

export interface DirectoryMake {
  id: string; name: string; kind: string;
  series: { id: string; name: string; yearFrom: number | null; yearTo: number | null; engines: { id: string; code: string; euroClass?: string | null }[] }[];
}
export interface GarageOption { id: string; kind: string; label: string; plate: string | null }

/** Липка панель «Моє авто: … ▾» — перемикає контекст підбору на всьому сайті (SPEC §11). */
export function VehicleSwitcher({
  current, garage, directory, loggedIn,
}: {
  current: { label: string; source: "garage" | "quick"; vehicleId?: string } | null;
  garage: GarageOption[];
  directory: DirectoryMake[];
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [makeId, setMakeId] = React.useState("");
  const [seriesId, setSeriesId] = React.useState("");
  const [engineId, setEngineId] = React.useState("");
  const [year, setYear] = React.useState("");

  const make = directory.find((m) => m.id === makeId);
  const series = make?.series.find((s) => s.id === seriesId);

  const apply = (value: string | null, msg?: string) =>
    start(async () => {
      await setVehicleContextAction(value);
      setOpen(false);
      router.refresh();
      if (msg) toast.success(msg);
    });

  const years = series ? range(series.yearFrom ?? 1995, series.yearTo ?? new Date().getFullYear()) : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "group flex h-10 max-w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
            current ? "border-primary/50 bg-primary/10 hover:bg-primary/15" : "border-dashed border-input hover:border-primary/60 hover:bg-accent",
          )}
          aria-label="Обрати авто для підбору"
        >
          <Truck className={cn("size-4.5 shrink-0", current ? "text-primary" : "text-muted-foreground")} />
          <span className="text-muted-foreground max-sm:hidden">Моє авто:</span>
          <span className="truncate font-bold">{current ? current.label : "оберіть для підбору"}</span>
          <ChevronDown className="size-4 shrink-0 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,380px)] p-0">
        {garage.length > 0 && (
          <div className="border-b p-2">
            <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">Мій гараж</p>
            {garage.map((v) => {
              const selected = current?.vehicleId === v.id;
              return (
                <button key={v.id} disabled={pending} onClick={() => apply(`v:${v.id}`, `Підбір під: ${v.label}`)}
                  className={cn("flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2.5 text-left text-sm hover:bg-accent", selected && "bg-accent")}>
                  <span className={cn("flex size-5 items-center justify-center rounded-full border", selected && "border-primary bg-primary text-primary-foreground")}>
                    {selected && <Check className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{v.label}</span>
                    {v.plate && <span className="font-num text-xs text-muted-foreground">{v.plate}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="grid gap-2.5 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">{garage.length ? "Або швидкий вибір" : "Швидкий вибір моделі"}</p>
          <NativeSelect aria-label="Марка" value={makeId} onChange={(e) => { setMakeId(e.target.value); setSeriesId(""); setEngineId(""); setYear(""); }}>
            <option value="">Марка</option>
            <optgroup label="Тягачі">
              {directory.filter((m) => m.kind !== "TRAILER").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </optgroup>
            <optgroup label="Напівпричепи">
              {directory.filter((m) => m.kind === "TRAILER").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </optgroup>
          </NativeSelect>
          <div className="grid grid-cols-2 gap-2">
            <NativeSelect aria-label="Серія" value={seriesId} disabled={!make} onChange={(e) => { setSeriesId(e.target.value); setEngineId(""); }}>
              <option value="">Серія</option>
              {make?.series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </NativeSelect>
            <NativeSelect aria-label="Двигун" value={engineId} disabled={!series?.engines.length} onChange={(e) => setEngineId(e.target.value)}>
              <option value="">Двигун</option>
              {series?.engines.map((e) => <option key={e.id} value={e.id}>{e.code}</option>)}
            </NativeSelect>
          </div>
          <NativeSelect aria-label="Рік" value={year} disabled={!series} onChange={(e) => setYear(e.target.value)}>
            <option value="">Рік випуску (необов&apos;язково)</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </NativeSelect>
          <Button disabled={!makeId || pending} onClick={() => apply(`q:${makeId}:${seriesId}:${engineId}:${year}`, "Контекст підбору встановлено")}>
            Підбирати під цю модель
          </Button>
          <p className="text-xs text-muted-foreground">
            Для точного підбору з урахуванням номера шасі{" "}
            {loggedIn ? "додайте авто в гараж за VIN." : "увійдіть і додайте авто в гараж за VIN."}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 border-t p-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={loggedIn ? "/account/garage/new" : "/vin"} onClick={() => setOpen(false)}><Plus /> Додати за VIN</Link>
          </Button>
          {current && (
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => apply(null)}>
              <X /> Скинути
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function range(a: number, b: number) {
  const out: number[] = [];
  for (let y = Math.min(b, new Date().getFullYear()); y >= a; y--) out.push(y);
  return out;
}
