"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, ScanLine, Wand2 } from "lucide-react";
import type { VehicleKind } from "@prisma/client";
import { saveVehicleAction } from "@/server/actions/account";
import { decodeVinAction } from "@/server/actions/shop";
import type { DecodedVin } from "@/server/vin/types";
import { Field, FormMessage, SubmitButton } from "@/components/shared/form";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import type { ActionState } from "@/lib/validators";
import type { DirectoryMake } from "@/components/shop/vehicle-switcher";
import { VEHICLE_KIND } from "@/lib/labels";
import { cn } from "@/lib/utils";

export interface VehicleFormValues {
  id?: string; kind: VehicleKind; nickname?: string | null; vin?: string | null; chassisNumber?: string | null;
  makeId?: string | null; seriesId?: string | null; engineCodeId?: string | null; year?: number | null; euroClass?: string | null;
  gearbox?: string | null; axleConfig?: string | null; cabType?: string | null; axleBrand?: string | null; plate?: string | null; mileageKm?: number | null;
}

const EURO = ["Euro 3", "Euro 4", "Euro 5", "EEV", "Euro 6"];
const AXLE_CFG = ["4x2", "6x2", "6x4", "8x4"];
const TRAILER_AXLES = ["1 вісь", "2 осі", "3 осі"];

export function VehicleForm({ directory, initial, autoDecode }: { directory: DirectoryMake[]; initial: VehicleFormValues; autoDecode?: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(saveVehicleAction, {});
  const [v, setV] = React.useState<VehicleFormValues>(initial);
  const [decoded, setDecoded] = React.useState<DecodedVin | null>(null);
  const [decoding, startDecode] = React.useTransition();
  const fe = state.fieldErrors ?? {};
  const set = (patch: Partial<VehicleFormValues>) => setV((cur) => ({ ...cur, ...patch }));

  const makes = directory.filter((m) => (v.kind === "TRAILER" ? m.kind === "TRAILER" : m.kind !== "TRAILER"));
  const make = directory.find((m) => m.id === v.makeId);
  const series = make?.series.find((s) => s.id === v.seriesId);
  const engine = series?.engines.find((e) => e.id === v.engineCodeId);

  const decode = React.useCallback((vin: string) => {
    startDecode(async () => {
      const res = await decodeVinAction(vin);
      setDecoded(res);
      setV((cur) => ({
        ...cur,
        vin: res.vin,
        kind: res.kind ?? cur.kind,
        makeId: res.makeId ?? cur.makeId,
        seriesId: res.makeId && res.makeId !== cur.makeId ? null : cur.seriesId,
        engineCodeId: res.makeId && res.makeId !== cur.makeId ? null : cur.engineCodeId,
        year: cur.year ?? res.modelYear ?? null,
        chassisNumber: cur.chassisNumber || res.serial || null,
      }));
    });
  }, []);

  React.useEffect(() => {
    if (autoDecode && initial.vin) decode(initial.vin);
  }, [autoDecode, initial.vin, decode]);

  const years = series ? range(series.yearFrom ?? 1995, series.yearTo ?? new Date().getFullYear()) : range(1995, new Date().getFullYear());

  return (
    <form action={action} className="grid gap-6" noValidate>
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <input type="hidden" name="kind" value={v.kind} />

      <section className="grid gap-4 rounded-xl border bg-card p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Тип техніки">
          {(["TRACTOR", "TRUCK", "TRAILER", "BUS"] as VehicleKind[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={v.kind === k} onClick={() => set({ kind: k, ...(k === "TRAILER" ? { engineCodeId: null } : { axleBrand: null }), ...((k === "TRAILER") !== (v.kind === "TRAILER") ? { makeId: null, seriesId: null } : {}) })}
              className={cn("h-11 cursor-pointer rounded-lg border text-sm font-bold", v.kind === k ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:bg-accent")}>
              {VEHICLE_KIND[k]}
            </button>
          ))}
        </div>

        <Field label="VIN" htmlFor="vin" error={fe.vin} hint="Автоматично визначимо марку, рік і номер шасі">
          <div className="flex gap-2">
            <Input id="vin" name="vin" value={v.vin ?? ""} onChange={(e) => set({ vin: e.target.value.toUpperCase() })} className="font-num tracking-wider uppercase" maxLength={24} spellCheck={false} autoCapitalize="characters" />
            <Button type="button" variant="secondary" onClick={() => v.vin && decode(v.vin)} disabled={!v.vin || decoding}>
              {decoding ? <Loader2 className="animate-spin" /> : <Wand2 />} <span className="max-sm:hidden">Заповнити</span>
            </Button>
          </div>
        </Field>
        {decoded && (
          <div className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-sm", decoded.makeId ? "border-success/40 bg-success/10" : "border-warning/40 bg-warning/10")}>
            <ScanLine className="mt-0.5 size-4 shrink-0" />
            <span>
              {decoded.makeId ? <>Визначено: <b>{decoded.make}</b>{decoded.modelYear ? `, ${decoded.modelYear} р.` : ""}{decoded.serial ? <>, шасі <span className="font-num">{decoded.serial}</span></> : ""}. Уточніть серію і двигун нижче.</> : <>Не вдалося визначити марку. {decoded.issues.join(". ")}</>}
            </span>
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <Field label="Марка" htmlFor="makeId" error={fe.makeId}>
          <NativeSelect id="makeId" name="makeId" value={v.makeId ?? ""} onChange={(e) => set({ makeId: e.target.value || null, seriesId: null, engineCodeId: null })}>
            <option value="">— оберіть —</option>
            {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Серія / модель" htmlFor="seriesId">
          <NativeSelect id="seriesId" name="seriesId" value={v.seriesId ?? ""} disabled={!make} onChange={(e) => set({ seriesId: e.target.value || null, engineCodeId: null })}>
            <option value="">— оберіть —</option>
            {make?.series.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.yearFrom ?? "…"}–{s.yearTo ?? "н.ч."})</option>)}
          </NativeSelect>
        </Field>
        {v.kind !== "TRAILER" && (
          <Field label="Двигун" htmlFor="engineCodeId">
            <NativeSelect id="engineCodeId" name="engineCodeId" value={v.engineCodeId ?? ""} disabled={!series?.engines.length} onChange={(e) => {
              const eng = series?.engines.find((x) => x.id === e.target.value);
              set({ engineCodeId: e.target.value || null, euroClass: v.euroClass || eng?.euroClass || null });
            }}>
              <option value="">— оберіть —</option>
              {series?.engines.map((e) => <option key={e.id} value={e.id}>{e.code}</option>)}
            </NativeSelect>
          </Field>
        )}
        <Field label="Рік випуску" htmlFor="year" error={fe.year}>
          <NativeSelect id="year" name="year" value={v.year ?? ""} onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : null })}>
            <option value="">— оберіть —</option>
            {v.year && !years.includes(v.year) && <option value={v.year}>{v.year}</option>}
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Номер шасі" htmlFor="chassisNumber" hint="Для деталей, що змінюються в межах моделі">
          <Input id="chassisNumber" name="chassisNumber" value={v.chassisNumber ?? ""} onChange={(e) => set({ chassisNumber: e.target.value.toUpperCase() })} className="font-num uppercase" />
        </Field>
        {v.kind === "TRAILER" ? (
          <>
            <Field label="Марка осей" htmlFor="axleBrand" hint="Від неї залежать гальма і ступиці">
              <NativeSelect id="axleBrand" name="axleBrand" value={v.axleBrand ?? ""} onChange={(e) => set({ axleBrand: e.target.value || null })}>
                <option value="">— оберіть —</option>
                {["BPW", "SAF", "ROR"].map((a) => <option key={a} value={a}>{a}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Кількість осей" htmlFor="axleConfig">
              <NativeSelect id="axleConfig" name="axleConfig" value={v.axleConfig ?? ""} onChange={(e) => set({ axleConfig: e.target.value || null })}>
                <option value="">—</option>
                {TRAILER_AXLES.map((a) => <option key={a} value={a}>{a}</option>)}
              </NativeSelect>
            </Field>
          </>
        ) : (
          <>
            <Field label="Екологічний клас" htmlFor="euroClass">
              <NativeSelect id="euroClass" name="euroClass" value={v.euroClass ?? ""} onChange={(e) => set({ euroClass: e.target.value || null })}>
                <option value="">—</option>
                {EURO.map((x) => <option key={x} value={x}>{x}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Колісна формула" htmlFor="axleConfig">
              <NativeSelect id="axleConfig" name="axleConfig" value={v.axleConfig ?? ""} onChange={(e) => set({ axleConfig: e.target.value || null })}>
                <option value="">—</option>
                {AXLE_CFG.map((x) => <option key={x} value={x}>{x}</option>)}
              </NativeSelect>
            </Field>
            <Field label="КПП" htmlFor="gearbox">
              <Input id="gearbox" name="gearbox" value={v.gearbox ?? ""} onChange={(e) => set({ gearbox: e.target.value })} placeholder="ZF AS-Tronic 12AS2130" />
            </Field>
            <Field label="Тип кабіни" htmlFor="cabType">
              <Input id="cabType" name="cabType" value={v.cabType ?? ""} onChange={(e) => set({ cabType: e.target.value })} placeholder="Super Space Cab" />
            </Field>
          </>
        )}
      </section>

      <section className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-3">
        <Field label="Назва в гаражі" htmlFor="nickname" hint="Напр. «Білий DAF Петра»">
          <Input id="nickname" name="nickname" value={v.nickname ?? ""} onChange={(e) => set({ nickname: e.target.value })} />
        </Field>
        <Field label="Держномер" htmlFor="plate">
          <Input id="plate" name="plate" value={v.plate ?? ""} onChange={(e) => set({ plate: e.target.value.toUpperCase() })} className="font-num uppercase" placeholder="AA 1234 BB" />
        </Field>
        <Field label="Пробіг, км" htmlFor="mileageKm" error={fe.mileageKm}>
          <Input id="mileageKm" name="mileageKm" inputMode="numeric" value={v.mileageKm ?? ""} onChange={(e) => set({ mileageKm: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null })} />
        </Field>
      </section>

      <FormMessage state={state} />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton size="lg" pendingText="Зберігаємо…">{v.id ? "Зберегти зміни" : "Додати в гараж"}</SubmitButton>
        {make && <p className="text-sm text-muted-foreground">{[make.name, series?.name, engine?.code].filter(Boolean).join(" · ")}</p>}
      </div>
    </form>
  );
}

function range(a: number, b: number) {
  const out: number[] = [];
  for (let y = Math.min(b, new Date().getFullYear() + 1); y >= a; y--) out.push(y);
  return out;
}
