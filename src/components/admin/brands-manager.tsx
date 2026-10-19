"use client";

import * as React from "react";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import type { VehicleKind } from "@prisma/client";
import {
  deleteEngineAction, deleteMakeAction, deletePartBrandAction, deleteSeriesAction, saveEngineAction, saveMakeAction, savePartBrandAction, saveSeriesAction,
} from "@/server/actions/admin";
import { DeleteButton, FormDialog } from "./form-dialog";
import { Field } from "@/components/shared/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, NativeSelect } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VEHICLE_KIND } from "@/lib/labels";

interface PartBrand { id: string; name: string; isOriginal: boolean; country: string | null; _count: { products: number } }
interface Make {
  id: string; name: string; kind: VehicleKind; wmiCodes: string[]; country: string | null; _count: { vehicles: number; fitments: number };
  series: { id: string; name: string; yearFrom: number | null; yearTo: number | null; engines: { id: string; code: string; powerHp: number | null; euroClass: string | null }[] }[];
}

const iconBtn = (label: string, Icon: typeof Pencil, danger?: boolean) => (
  <Button type="button" size="icon-sm" variant="ghost" aria-label={label} className={danger ? "text-danger" : undefined}><Icon /></Button>
);

function PartBrandFields({ b }: { b?: PartBrand }) {
  return (
    <>
      {b && <input type="hidden" name="id" value={b.id} />}
      <Field label="Назва" required><Input name="name" defaultValue={b?.name} /></Field>
      <Field label="Країна"><Input name="country" defaultValue={b?.country ?? ""} /></Field>
      <label className="flex items-center gap-2 text-sm font-semibold"><Checkbox name="isOriginal" defaultChecked={b?.isOriginal} /> Оригінальний виробник (OE)</label>
    </>
  );
}

function MakeFields({ m }: { m?: Make }) {
  return (
    <>
      {m && <input type="hidden" name="id" value={m.id} />}
      <Field label="Назва" required><Input name="name" defaultValue={m?.name} /></Field>
      <Field label="Тип"><NativeSelect name="kind" defaultValue={m?.kind ?? "TRACTOR"}>{(Object.keys(VEHICLE_KIND) as VehicleKind[]).map((k) => <option key={k} value={k}>{VEHICLE_KIND[k]}</option>)}</NativeSelect></Field>
      <Field label="WMI-коди" hint="Перші 3 символи VIN, через кому. Використовуються VIN-декодером."><Input name="wmiCodes" defaultValue={m?.wmiCodes.join(", ")} className="font-num uppercase" /></Field>
      <Field label="Країна"><Input name="country" defaultValue={m?.country ?? ""} /></Field>
    </>
  );
}

export function BrandsManager({ brands, makes }: { brands: PartBrand[]; makes: Make[] }) {
  const [openMake, setOpenMake] = React.useState<string | null>(null);
  return (
    <Tabs defaultValue="makes">
      <TabsList>
        <TabsTrigger value="makes">Марки авто, серії, двигуни ({makes.length})</TabsTrigger>
        <TabsTrigger value="parts">Бренди деталей ({brands.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="makes" className="grid gap-3">
        <div><FormDialog title="Нова марка" action={saveMakeAction} trigger={<Button><Plus /> Марка</Button>}><MakeFields /></FormDialog></div>
        {makes.map((m) => (
          <div key={m.id} className="rounded-xl border bg-card">
            <div className="flex flex-wrap items-center gap-2 p-3">
              <button className="flex cursor-pointer items-center gap-2 font-bold" onClick={() => setOpenMake(openMake === m.id ? null : m.id)} aria-expanded={openMake === m.id}>
                <ChevronRight className={`size-4 transition-transform ${openMake === m.id ? "rotate-90" : ""}`} /> {m.name}
              </button>
              <Badge tone={m.kind === "TRAILER" ? "blue" : "outline"}>{VEHICLE_KIND[m.kind]}</Badge>
              <span className="font-num text-xs text-muted-foreground">WMI: {m.wmiCodes.join(", ") || "—"}</span>
              <span className="ml-auto text-xs text-muted-foreground">{m.series.length} серій · {m._count.fitments} правил · {m._count.vehicles} авто в гаражах</span>
              <FormDialog title={`Редагувати ${m.name}`} action={saveMakeAction} trigger={iconBtn("Редагувати", Pencil)}><MakeFields m={m} /></FormDialog>
              <DeleteButton label={`Видалити марку ${m.name} разом із серіями і правилами застосовності?`} onDelete={() => deleteMakeAction(m.id)}>{iconBtn("Видалити", Trash2, true)}</DeleteButton>
            </div>
            {openMake === m.id && (
              <div className="grid gap-2 border-t p-3">
                {m.series.map((s) => (
                  <div key={s.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{s.yearFrom ?? "…"}–{s.yearTo ?? "н.ч."}</span>
                      <span className="ml-auto" />
                      <FormDialog title="Серія" action={saveSeriesAction} trigger={iconBtn("Редагувати серію", Pencil)}>
                        <input type="hidden" name="id" value={s.id} /><input type="hidden" name="makeId" value={m.id} />
                        <Field label="Назва" required><Input name="name" defaultValue={s.name} /></Field>
                        <div className="grid grid-cols-2 gap-2"><Field label="Рік від"><Input name="yearFrom" defaultValue={s.yearFrom ?? ""} /></Field><Field label="Рік до"><Input name="yearTo" defaultValue={s.yearTo ?? ""} /></Field></div>
                      </FormDialog>
                      <DeleteButton label={`Видалити серію ${s.name}?`} onDelete={() => deleteSeriesAction(s.id)}>{iconBtn("Видалити серію", Trash2, true)}</DeleteButton>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {s.engines.map((e) => (
                        <span key={e.id} className="inline-flex items-center gap-1 rounded-md border bg-muted/50 py-0.5 pr-0.5 pl-2 text-xs">
                          <span className="font-num font-semibold">{e.code}</span>{e.powerHp ? ` ${e.powerHp} к.с.` : ""}{e.euroClass ? ` · ${e.euroClass}` : ""}
                          <FormDialog title="Двигун" action={saveEngineAction} trigger={<button className="cursor-pointer rounded p-1 hover:bg-accent" aria-label="Редагувати двигун"><Pencil className="size-3" /></button>}>
                            <input type="hidden" name="id" value={e.id} /><input type="hidden" name="seriesId" value={s.id} />
                            <Field label="Код" required><Input name="code" defaultValue={e.code} className="font-num" /></Field>
                            <div className="grid grid-cols-2 gap-2"><Field label="Потужність, к.с."><Input name="powerHp" defaultValue={e.powerHp ?? ""} /></Field><Field label="Євро"><Input name="euroClass" defaultValue={e.euroClass ?? ""} /></Field></div>
                          </FormDialog>
                          <DeleteButton label={`Видалити двигун ${e.code}?`} onDelete={() => deleteEngineAction(e.id)}><button className="cursor-pointer rounded p-1 text-danger hover:bg-accent" aria-label="Видалити двигун"><Trash2 className="size-3" /></button></DeleteButton>
                        </span>
                      ))}
                      {m.kind !== "TRAILER" && (
                        <FormDialog title={`Новий двигун для ${s.name}`} action={saveEngineAction} trigger={<Button size="sm" variant="ghost" className="h-7"><Plus /> Двигун</Button>}>
                          <input type="hidden" name="seriesId" value={s.id} />
                          <Field label="Код" required><Input name="code" className="font-num" /></Field>
                          <div className="grid grid-cols-2 gap-2"><Field label="Потужність, к.с."><Input name="powerHp" /></Field><Field label="Євро"><Input name="euroClass" /></Field></div>
                        </FormDialog>
                      )}
                    </div>
                  </div>
                ))}
                <FormDialog title={`Нова серія ${m.name}`} action={saveSeriesAction} trigger={<Button size="sm" variant="outline" className="justify-self-start"><Plus /> Серія</Button>}>
                  <input type="hidden" name="makeId" value={m.id} />
                  <Field label="Назва" required><Input name="name" /></Field>
                  <div className="grid grid-cols-2 gap-2"><Field label="Рік від"><Input name="yearFrom" /></Field><Field label="Рік до"><Input name="yearTo" /></Field></div>
                </FormDialog>
              </div>
            )}
          </div>
        ))}
      </TabsContent>
      <TabsContent value="parts" className="grid gap-3">
        <div><FormDialog title="Новий бренд" action={savePartBrandAction} trigger={<Button><Plus /> Бренд</Button>}><PartBrandFields /></FormDialog></div>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-xs text-muted-foreground uppercase"><tr><th className="px-3 py-2 text-left">Бренд</th><th className="px-3 py-2 text-left">Тип</th><th className="px-3 py-2 text-left">Країна</th><th className="px-3 py-2 text-right">Товарів</th><th /></tr></thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-semibold">{b.name}</td>
                  <td className="px-3 py-2">{b.isOriginal ? <Badge tone="primary">Оригінал</Badge> : <Badge>Аналог</Badge>}</td>
                  <td className="px-3 py-2 text-muted-foreground">{b.country}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{b._count.products}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <FormDialog title="Редагувати бренд" action={savePartBrandAction} trigger={iconBtn("Редагувати", Pencil)}><PartBrandFields b={b} /></FormDialog>
                    <DeleteButton label={`Видалити бренд ${b.name}?`} onDelete={() => deletePartBrandAction(b.id)}>{iconBtn("Видалити", Trash2, true)}</DeleteButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
