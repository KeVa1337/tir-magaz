"use client";

import * as React from "react";
import { useActionState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { StockStatus } from "@prisma/client";
import {
  addFitmentAction, addNumberAction, deleteFitmentAction, deleteImageAction, deleteNumberAction, deleteProductAction, moveImageAction,
  saveAttributesAction, saveProductAction, uploadProductImagesAction,
} from "@/server/actions/admin";
import { Field, FormMessage, SubmitButton } from "@/components/shared/form";
import { PartNumber } from "@/components/shared/part-number";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { DirectoryMake } from "@/components/shop/vehicle-switcher";
import { STOCK_STATUS } from "@/lib/labels";
import type { ActionState } from "@/lib/validators";

export interface ProductFormValues {
  id?: string; name: string; article: string; sku: string; slug: string; brandId: string; categoryId: string; description: string;
  price: string; oldPrice: string; purchasePrice: string; stockQty: string; stockStatus: StockStatus; leadTimeDays: string; weightKg: string;
  isActive: boolean; isPopular: boolean; isUniversal: boolean; seoTitle: string; seoDescription: string;
}

const tabCls = "data-[state=inactive]:hidden";

export function ProductMainForm({ v, brands, categories }: { v: ProductFormValues; brands: { id: string; name: string }[]; categories: { id: string; name: string; parent?: string | null }[] }) {
  const [state, action] = useActionState<ActionState, FormData>(saveProductAction, {});
  const fe = state.fieldErrors ?? {};
  const [price, setPrice] = React.useState(v.price);
  const [purchase, setPurchase] = React.useState(v.purchasePrice);
  const margin = Number(price) && Number(purchase) ? Math.round(((Number(price) - Number(purchase)) / Number(price)) * 100) : null;
  const [seoTitle, setSeoTitle] = React.useState(v.seoTitle);
  const [seoDesc, setSeoDesc] = React.useState(v.seoDescription);

  return (
    <form action={action} className="grid gap-4" noValidate>
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <Tabs defaultValue="main">
        <TabsList>
          <TabsTrigger value="main">Основне</TabsTrigger>
          <TabsTrigger value="price">Ціни й залишки</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>
        <TabsContent value="main" forceMount className={tabCls}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Назва" htmlFor="name" error={fe.name} required className="sm:col-span-2"><Input id="name" name="name" defaultValue={v.name} /></Field>
            <Field label="Артикул виробника" htmlFor="article" error={fe.article} required hint="Нормалізується для пошуку автоматично"><Input id="article" name="article" defaultValue={v.article} className="font-num" /></Field>
            <Field label="Внутрішній код (SKU)" htmlFor="sku" hint="Порожньо — згенерується"><Input id="sku" name="sku" defaultValue={v.sku} className="font-num" /></Field>
            <Field label="Бренд" htmlFor="brandId" error={fe.brandId} required>
              <NativeSelect id="brandId" name="brandId" defaultValue={v.brandId}><option value="">— оберіть —</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</NativeSelect>
            </Field>
            <Field label="Категорія" htmlFor="categoryId" error={fe.categoryId} required>
              <NativeSelect id="categoryId" name="categoryId" defaultValue={v.categoryId}><option value="">— оберіть —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.parent ? `${c.parent} › ` : ""}{c.name}</option>)}</NativeSelect>
            </Field>
            <Field label="Опис" htmlFor="description" className="sm:col-span-2"><Textarea id="description" name="description" rows={5} defaultValue={v.description} /></Field>
            <Field label="URL (slug)" htmlFor="slug" hint="Порожньо — з назви" className="sm:col-span-2"><Input id="slug" name="slug" defaultValue={v.slug} className="font-num text-xs" /></Field>
            <div className="flex flex-wrap gap-5 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold"><Checkbox name="isActive" defaultChecked={v.isActive} /> Активний (видно на сайті)</label>
              <label className="flex items-center gap-2 text-sm font-semibold"><Checkbox name="isPopular" defaultChecked={v.isPopular} /> Популярний (на головній)</label>
              <label className="flex items-center gap-2 text-sm font-semibold"><Checkbox name="isUniversal" defaultChecked={v.isUniversal} /> Універсальний (підходить до всіх)</label>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="price" forceMount className={tabCls}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Ціна, ₴" htmlFor="price" error={fe.price} required><Input id="price" name="price" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className="font-num" /></Field>
            <Field label="Стара ціна, ₴" htmlFor="oldPrice" error={fe.oldPrice} hint="Для показу знижки"><Input id="oldPrice" name="oldPrice" defaultValue={v.oldPrice} inputMode="decimal" className="font-num" /></Field>
            <Field label="Закупівля, ₴" htmlFor="purchasePrice" error={fe.purchasePrice} hint={margin != null ? `Маржа ${margin}%` : "Видно лише в адмінці"}><Input id="purchasePrice" name="purchasePrice" value={purchase} onChange={(e) => setPurchase(e.target.value)} inputMode="decimal" className="font-num" /></Field>
            <Field label="Залишок, шт." htmlFor="stockQty" error={fe.stockQty}><Input id="stockQty" name="stockQty" defaultValue={v.stockQty} inputMode="numeric" className="font-num" /></Field>
            <Field label="Статус наявності" htmlFor="stockStatus">
              <NativeSelect id="stockStatus" name="stockStatus" defaultValue={v.stockStatus}>{(Object.keys(STOCK_STATUS) as StockStatus[]).map((s) => <option key={s} value={s}>{STOCK_STATUS[s].label}</option>)}</NativeSelect>
            </Field>
            <Field label="Термін під замовлення, дн." htmlFor="leadTimeDays" error={fe.leadTimeDays}><Input id="leadTimeDays" name="leadTimeDays" defaultValue={v.leadTimeDays} inputMode="numeric" className="font-num" /></Field>
            <Field label="Вага, кг" htmlFor="weightKg" error={fe.weightKg}><Input id="weightKg" name="weightKg" defaultValue={v.weightKg} inputMode="decimal" className="font-num" /></Field>
          </div>
        </TabsContent>
        <TabsContent value="seo" forceMount className={tabCls}>
          <div className="grid gap-4">
            <Field label="SEO title" htmlFor="seoTitle" hint={`${seoTitle.length}/60 · порожньо — «назва + бренд + артикул»`}><Input id="seoTitle" name="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} /></Field>
            <Field label="SEO description" htmlFor="seoDescription" hint={`${seoDesc.length}/160`}><Textarea id="seoDescription" name="seoDescription" rows={3} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} /></Field>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Попередній перегляд у пошуку</p>
              <p className="mt-1 truncate text-base font-semibold text-info">{seoTitle || v.name || "Назва товару"} · TIR Parts</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">{seoDesc || v.description || "Опис товару…"}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <FormMessage state={state} />
      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <SubmitButton pendingText="Зберігаємо…">{v.id ? "Зберегти" : "Створити товар"}</SubmitButton>
        {v.id && <DeleteProduct id={v.id} />}
      </div>
    </form>
  );
}

function DeleteProduct({ id }: { id: string }) {
  const [pending, start] = React.useTransition();
  return (
    <Dialog>
      <DialogTrigger asChild><Button type="button" variant="ghost" className="ml-auto text-danger"><Trash2 /> Видалити</Button></DialogTrigger>
      <DialogContent>
        <DialogTitle>Видалити товар?</DialogTitle>
        <DialogDescription>Якщо товар є в замовленнях, його буде деактивовано, а не видалено.</DialogDescription>
        <div className="flex justify-end gap-2">
          <DialogClose asChild><Button variant="outline">Скасувати</Button></DialogClose>
          <Button variant="destructive" disabled={pending} onClick={() => start(() => deleteProductAction(id))}>{pending && <Loader2 className="animate-spin" />} Видалити</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ImagesEditor({ productId, images }: { productId: string; images: { id: string; url: string }[] }) {
  const [state, action] = useActionState<ActionState, FormData>(uploadProductImagesAction, {});
  const [pending, start] = React.useTransition();
  const ref = React.useRef<HTMLFormElement>(null);
  React.useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="h-full w-full object-contain" />
            {i === 0 && <Badge tone="primary" className="absolute top-1.5 left-1.5">Головне</Badge>}
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1">
              <Button size="icon-sm" variant="secondary" disabled={pending || i === 0} onClick={() => start(async () => { await moveImageAction(img.id, -1); })} aria-label="Вліво"><ArrowUp className="-rotate-90" /></Button>
              <Button size="icon-sm" variant="secondary" disabled={pending || i === images.length - 1} onClick={() => start(async () => { await moveImageAction(img.id, 1); })} aria-label="Вправо"><ArrowDown className="-rotate-90" /></Button>
              <Button size="icon-sm" variant="destructive" disabled={pending} onClick={() => start(async () => { await deleteImageAction(img.id); })} aria-label="Видалити"><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>
      <form ref={ref} action={action} className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-4">
        <input type="hidden" name="productId" value={productId} />
        <input type="file" name="files" accept="image/jpeg,image/png,image/webp" multiple className="text-sm" aria-label="Фото товару" />
        <SubmitButton size="sm" variant="secondary"><Upload /> Завантажити</SubmitButton>
        <span className="text-xs text-muted-foreground">JPG/PNG/WEBP до 5 МБ, до 10 файлів</span>
        <div className="w-full"><FormMessage state={state} /></div>
      </form>
    </div>
  );
}

export function NumbersEditor({ productId, numbers }: { productId: string; numbers: { id: string; number: string; type: "OE" | "CROSS"; brandName: string | null }[] }) {
  const [num, setNum] = React.useState("");
  const [type, setType] = React.useState<"OE" | "CROSS">("OE");
  const [brand, setBrand] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <div className="grid gap-4">
      <ul className="divide-y rounded-lg border">
        {numbers.map((n) => (
          <li key={n.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="flex items-center gap-2"><Badge tone={n.type === "OE" ? "primary" : "neutral"}>{n.type === "OE" ? "OE" : "Крос"}</Badge><PartNumber value={n.number} /> <span className="text-xs text-muted-foreground">{n.brandName}</span></span>
            <Button size="icon-sm" variant="ghost" className="text-danger" disabled={pending} onClick={() => start(async () => { await deleteNumberAction(n.id); })} aria-label="Видалити"><Trash2 /></Button>
          </li>
        ))}
        {!numbers.length && <li className="px-3 py-3 text-sm text-muted-foreground">Номерів ще немає</li>}
      </ul>
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await addNumberAction(productId, num, type, brand); if (r.ok) { setNum(""); toast.success("Номер додано"); } else toast.error(r.error); }); }}>
        <NativeSelect value={type} onChange={(e) => setType(e.target.value as "OE" | "CROSS")} className="h-9 w-32" aria-label="Тип"><option value="OE">OE</option><option value="CROSS">Крос</option></NativeSelect>
        <Input value={num} onChange={(e) => setNum(e.target.value)} placeholder="Номер" className="h-9 w-48 font-num" aria-label="Номер" />
        <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Чий номер (DAF, Wabco…)" className="h-9 w-52" aria-label="Бренд номера" />
        <Button size="sm" className="h-9" disabled={!num.trim() || pending}><Plus /> Додати</Button>
      </form>
    </div>
  );
}

interface FitRow { id: string; make: string | null; series: string | null; engine: string | null; axleBrand: string | null; yearFrom: number | null; yearTo: number | null; chassisFrom: string | null; chassisTo: string | null; position: string | null; note: string | null }

export function FitmentsEditor({ productId, fitments, directory }: { productId: string; fitments: FitRow[]; directory: DirectoryMake[] }) {
  const [f, setF] = React.useState<Record<string, string>>({});
  const [pending, start] = React.useTransition();
  const make = directory.find((m) => m.id === f.makeId);
  const series = make?.series.find((s) => s.id === f.seriesId);
  const set = (k: string, v: string) => setF((cur) => ({ ...cur, [k]: v, ...(k === "makeId" ? { seriesId: "", engineCodeId: "" } : k === "seriesId" ? { engineCodeId: "" } : {}) }));
  return (
    <div className="grid gap-4">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b text-xs text-muted-foreground uppercase"><tr>{["Марка / осі", "Серія", "Двигун", "Роки", "Шасі", "Позиція", "Примітка", ""].map((h) => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {fitments.map((x) => (
              <tr key={x.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-semibold">{x.make ?? (x.axleBrand ? `Осі ${x.axleBrand}` : "—")}{x.make && x.axleBrand ? ` · ${x.axleBrand}` : ""}</td>
                <td className="px-3 py-2">{x.series ?? "усі"}</td>
                <td className="px-3 py-2 font-num text-xs">{x.engine ?? "усі"}</td>
                <td className="px-3 py-2 tabular-nums">{x.yearFrom || x.yearTo ? `${x.yearFrom ?? "…"}–${x.yearTo ?? "…"}` : "—"}</td>
                <td className="px-3 py-2 font-num text-xs">{x.chassisFrom || x.chassisTo ? `${x.chassisFrom ?? "…"}–${x.chassisTo ?? "…"}` : "—"}</td>
                <td className="px-3 py-2">{x.position ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{x.note}</td>
                <td className="px-3 py-2 text-right"><Button size="icon-sm" variant="ghost" className="text-danger" disabled={pending} onClick={() => start(async () => { await deleteFitmentAction(x.id); })} aria-label="Видалити"><Trash2 /></Button></td>
              </tr>
            ))}
            {!fitments.length && <tr><td colSpan={8} className="px-3 py-3 text-muted-foreground">Правил немає — товар показуватиметься як «Уточнити»</td></tr>}
          </tbody>
        </table>
      </div>
      <form className="grid gap-3 rounded-lg border border-dashed p-4 sm:grid-cols-4" onSubmit={(e) => {
        e.preventDefault();
        start(async () => { const r = await addFitmentAction(productId, f); if (r.ok) { setF({}); toast.success("Правило додано"); } else toast.error(r.error); });
      }}>
        <p className="text-sm font-bold sm:col-span-4">Нове правило застосовності</p>
        <Field label="Марка"><NativeSelect value={f.makeId ?? ""} onChange={(e) => set("makeId", e.target.value)}><option value="">—</option>{directory.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</NativeSelect></Field>
        <Field label="Серія"><NativeSelect value={f.seriesId ?? ""} disabled={!make} onChange={(e) => set("seriesId", e.target.value)}><option value="">усі серії</option>{make?.series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</NativeSelect></Field>
        <Field label="Двигун"><NativeSelect value={f.engineCodeId ?? ""} disabled={!series?.engines.length} onChange={(e) => set("engineCodeId", e.target.value)}><option value="">усі двигуни</option>{series?.engines.map((x) => <option key={x.id} value={x.id}>{x.code}</option>)}</NativeSelect></Field>
        <Field label="Марка осей (причіп)"><NativeSelect value={f.axleBrand ?? ""} onChange={(e) => set("axleBrand", e.target.value)}><option value="">—</option>{["BPW", "SAF", "ROR"].map((a) => <option key={a}>{a}</option>)}</NativeSelect></Field>
        <Field label="Рік від"><Input value={f.yearFrom ?? ""} onChange={(e) => set("yearFrom", e.target.value)} inputMode="numeric" placeholder={series?.yearFrom ? String(series.yearFrom) : ""} /></Field>
        <Field label="Рік до"><Input value={f.yearTo ?? ""} onChange={(e) => set("yearTo", e.target.value)} inputMode="numeric" placeholder={series?.yearTo ? String(series.yearTo) : ""} /></Field>
        <Field label="Шасі від"><Input value={f.chassisFrom ?? ""} onChange={(e) => set("chassisFrom", e.target.value)} className="font-num" /></Field>
        <Field label="Шасі до"><Input value={f.chassisTo ?? ""} onChange={(e) => set("chassisTo", e.target.value)} className="font-num" /></Field>
        <Field label="Позиція"><Input value={f.position ?? ""} onChange={(e) => set("position", e.target.value)} placeholder="передня вісь" /></Field>
        <Field label="Примітка" className="sm:col-span-2"><Input value={f.note ?? ""} onChange={(e) => set("note", e.target.value)} /></Field>
        <div className="flex items-end"><Button disabled={pending || (!f.makeId && !f.axleBrand)}><Plus /> Додати правило</Button></div>
      </form>
    </div>
  );
}

export function AttributesEditor({ productId, attributes }: { productId: string; attributes: { name: string; value: string }[] }) {
  const [rows, setRows] = React.useState(attributes.length ? attributes : [{ name: "", value: "" }]);
  const [pending, start] = React.useTransition();
  return (
    <div className="grid gap-2">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <Input value={r.name} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Назва (діаметр, мм)" aria-label="Назва атрибута" />
          <Input value={r.value} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="Значення" aria-label="Значення атрибута" />
          <Button size="icon" variant="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Видалити"><Trash2 /></Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setRows([...rows, { name: "", value: "" }])}><Plus /> Рядок</Button>
        <Button size="sm" disabled={pending} onClick={() => start(async () => { const r = await saveAttributesAction(productId, rows); if (r.ok) toast.success("Атрибути збережено"); else toast.error(r.error); })}>{pending && <Loader2 className="animate-spin" />} Зберегти атрибути</Button>
      </div>
    </div>
  );
}

