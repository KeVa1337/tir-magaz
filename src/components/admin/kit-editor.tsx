"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteKitAction, saveKitAction } from "@/server/actions/admin";
import { ProductPicker } from "./widgets";
import { Field } from "@/components/shared/form";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, NativeSelect, Textarea } from "@/components/ui/input";
import type { DirectoryMake } from "@/components/shop/vehicle-switcher";
import { formatPrice } from "@/lib/format";

interface KitItem { productId: string; name: string; article: string; brand: string; price: number; qty: number }
export interface KitValues { id?: string; name: string; description: string; intervalKm: string; makeId: string; seriesId: string; engineCodeId: string; isActive: boolean; items: KitItem[] }

export function KitEditor({ initial, directory }: { initial: KitValues; directory: DirectoryMake[] }) {
  const router = useRouter();
  const [v, setV] = React.useState(initial);
  const [pending, start] = React.useTransition();
  const make = directory.find((m) => m.id === v.makeId);
  const series = make?.series.find((s) => s.id === v.seriesId);
  const total = v.items.reduce((s, i) => s + i.price * i.qty, 0);

  const save = () =>
    start(async () => {
      const r = await saveKitAction({
        id: v.id, name: v.name, description: v.description, intervalKm: v.intervalKm ? Number(v.intervalKm) : undefined,
        makeId: v.makeId || undefined, seriesId: v.seriesId || undefined, engineCodeId: v.engineCodeId || undefined, isActive: v.isActive,
        items: v.items.map((i) => ({ productId: i.productId, qty: i.qty })),
      });
      if (!r.ok) return void toast.error(r.error);
      toast.success("Комплект збережено");
      if (!v.id && "id" in r && r.id) router.replace(`/admin/kits/${r.id}`);
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="grid content-start gap-4 rounded-xl border bg-card p-5">
        <Field label="Назва" required><Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="ТО-1 DAF XF 106 MX-13" /></Field>
        <Field label="Опис"><Textarea value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} rows={3} /></Field>
        <Field label="Інтервал, км"><Input value={v.intervalKm} onChange={(e) => setV({ ...v, intervalKm: e.target.value.replace(/\D/g, "") })} inputMode="numeric" /></Field>
        <Field label="Марка"><NativeSelect value={v.makeId} onChange={(e) => setV({ ...v, makeId: e.target.value, seriesId: "", engineCodeId: "" })}><option value="">будь-яка</option>{directory.filter((m) => m.kind !== "TRAILER").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</NativeSelect></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Серія"><NativeSelect value={v.seriesId} disabled={!make} onChange={(e) => setV({ ...v, seriesId: e.target.value, engineCodeId: "" })}><option value="">усі</option>{make?.series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</NativeSelect></Field>
          <Field label="Двигун"><NativeSelect value={v.engineCodeId} disabled={!series} onChange={(e) => setV({ ...v, engineCodeId: e.target.value })}><option value="">усі</option>{series?.engines.map((x) => <option key={x.id} value={x.id}>{x.code}</option>)}</NativeSelect></Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold"><Checkbox checked={v.isActive} onChange={(e) => setV({ ...v, isActive: e.target.checked })} /> Показувати на сайті</label>
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button onClick={save} disabled={pending}>{pending && <Loader2 className="animate-spin" />} Зберегти комплект</Button>
          {v.id && <Button variant="ghost" className="ml-auto text-danger" onClick={() => confirm("Видалити комплект?") && start(() => deleteKitAction(v.id!))}><Trash2 /> Видалити</Button>}
        </div>
      </div>
      <div className="grid content-start gap-3 rounded-xl border bg-card p-5">
        <p className="font-bold">Склад комплекту</p>
        <ProductPicker onPick={(p) => setV((cur) => cur.items.some((i) => i.productId === p.id) ? cur : { ...cur, items: [...cur.items, { productId: p.id, name: p.name, article: p.article, brand: p.brand, price: p.price, qty: 1 }] })} />
        <ul className="divide-y rounded-lg border">
          {v.items.map((i, idx) => (
            <li key={i.productId} className="flex items-center gap-2 px-3 py-2">
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{i.name}</span><span className="font-num text-xs text-muted-foreground">{i.article} · {i.brand}</span></span>
              <Input aria-label="Кількість" value={i.qty} onChange={(e) => { const q = Number(e.target.value.replace(/\D/g, "")) || 1; setV({ ...v, items: v.items.map((x, j) => (j === idx ? { ...x, qty: q } : x)) }); }} className="h-8 w-14 text-center font-num" />
              <span className="w-24 text-right text-sm tabular-nums">{formatPrice(i.price * i.qty)}</span>
              <Button size="icon-sm" variant="ghost" className="text-danger" onClick={() => setV({ ...v, items: v.items.filter((_, j) => j !== idx) })} aria-label="Прибрати"><Trash2 /></Button>
            </li>
          ))}
          {!v.items.length && <li className="px-3 py-3 text-sm text-muted-foreground">Додайте товари через пошук вище</li>}
        </ul>
        <p className="text-right font-bold">Разом: <span className="tabular-nums">{formatPrice(total)}</span></p>
      </div>
    </div>
  );
}
