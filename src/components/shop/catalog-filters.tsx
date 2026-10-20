"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Dialog, DialogClose, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, NativeSelect } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface Facets {
  brands: { slug: string; name: string; count: number; isOriginal: boolean }[];
  makes: { slug: string; name: string }[];
  price: { min: number; max: number };
  attributes: { name: string; values: { value: string; count: number }[] }[];
}

function useParamsNav() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const update = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mutate(p);
    p.delete("page");
    const s = p.toString();
    router.push(`${pathname}${s ? `?${s}` : ""}`, { scroll: false });
  };
  return { sp, update };
}

function FilterBody({ facets, vehicleLabel }: { facets: Facets; vehicleLabel: string | null }) {
  const { sp, update } = useParamsNav();
  const brands = (sp.get("brand") ?? "").split(",").filter(Boolean);
  const attrs = sp.getAll("a");
  const [pmin, setPmin] = React.useState(sp.get("pmin") ?? "");
  const [pmax, setPmax] = React.useState(sp.get("pmax") ?? "");

  const toggleBrand = (slug: string) =>
    update((p) => {
      const next = brands.includes(slug) ? brands.filter((b) => b !== slug) : [...brands, slug];
      if (next.length) p.set("brand", next.join(","));
      else p.delete("brand");
    });
  const toggleAttr = (v: string) =>
    update((p) => {
      const cur = p.getAll("a");
      p.delete("a");
      (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).forEach((x) => p.append("a", x));
    });

  return (
    <div className="grid gap-6">
      {vehicleLabel && (
        <label className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3", sp.get("fit") === "1" ? "border-primary bg-primary/10" : "hover:bg-accent")}>
          <Checkbox checked={sp.get("fit") === "1"} onChange={(e) => update((p) => { if (e.target.checked) p.set("fit", "1"); else p.delete("fit"); })} className="mt-0.5" />
          <span className="text-sm"><b>Тільки для мого авто</b><br /><span className="text-muted-foreground">{vehicleLabel}</span></span>
        </label>
      )}
      <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
        <Checkbox checked={sp.get("stock") === "1"} onChange={(e) => update((p) => { if (e.target.checked) p.set("stock", "1"); else p.delete("stock"); })} />
        Тільки в наявності
      </label>

      {facets.makes.length > 1 && (
        <div className="grid gap-2">
          <p className="text-sm font-bold">Марка авто</p>
          <NativeSelect value={sp.get("make") ?? ""} onChange={(e) => update((p) => { if (e.target.value) p.set("make", e.target.value); else p.delete("make"); })} aria-label="Марка авто">
            <option value="">Усі марки</option>
            {facets.makes.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
          </NativeSelect>
        </div>
      )}

      {facets.brands.length > 0 && (
        <div className="grid gap-2">
          <p className="text-sm font-bold">Виробник деталі</p>
          <div className="grid max-h-64 gap-1 overflow-y-auto pr-1">
            {facets.brands.map((b) => (
              <label key={b.slug} className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-sm hover:bg-accent">
                <Checkbox checked={brands.includes(b.slug)} onChange={() => toggleBrand(b.slug)} />
                <span className="flex-1">{b.name}{b.isOriginal && <span className="ml-1.5 text-xs text-primary">OE</span>}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{b.count}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {facets.price.max > 0 && (
        <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); update((p) => { if (pmin) p.set("pmin", pmin); else p.delete("pmin"); if (pmax) p.set("pmax", pmax); else p.delete("pmax"); }); }}>
          <p className="text-sm font-bold">Ціна, ₴</p>
          <div className="flex items-center gap-2">
            <Input inputMode="numeric" placeholder={String(Math.floor(facets.price.min))} value={pmin} onChange={(e) => setPmin(e.target.value.replace(/\D/g, ""))} aria-label="Ціна від" />
            <span className="text-muted-foreground">—</span>
            <Input inputMode="numeric" placeholder={String(Math.ceil(facets.price.max))} value={pmax} onChange={(e) => setPmax(e.target.value.replace(/\D/g, ""))} aria-label="Ціна до" />
          </div>
          <p className="text-xs text-muted-foreground">{formatPrice(facets.price.min)} – {formatPrice(facets.price.max)}</p>
          <Button type="submit" variant="secondary" size="sm">Застосувати</Button>
        </form>
      )}

      {facets.attributes.map((a) => (
        <div key={a.name} className="grid gap-2">
          <p className="text-sm font-bold">{a.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {a.values.map((v) => {
              const key = `${a.name}:${v.value}`;
              const on = attrs.includes(key);
              return (
                <button key={key} type="button" onClick={() => toggleAttr(key)} className={cn("cursor-pointer rounded-md border px-2.5 py-1.5 text-xs font-semibold", on ? "border-primary bg-primary/15" : "hover:bg-accent")}>
                  {v.value} <span className="text-muted-foreground">{v.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatalogFilters(props: { facets: Facets; vehicleLabel: string | null }) {
  return (
    <aside className="max-lg:hidden">
      <div className="sticky top-36 max-h-[calc(100dvh-10rem)] overflow-y-auto rounded-xl border bg-card p-4">
        <FilterBody {...props} />
      </div>
    </aside>
  );
}

export function MobileFilters(props: { facets: Facets; vehicleLabel: string | null; activeCount: number }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontal /> Фільтри {props.activeCount > 0 && <span className="rounded bg-primary px-1.5 text-xs text-primary-foreground">{props.activeCount}</span>}
        </Button>
      </DialogTrigger>
      <SheetContent side="bottom" title="Фільтри">
        <FilterBody facets={props.facets} vehicleLabel={props.vehicleLabel} />
        <DialogClose asChild><Button size="lg" className="mt-2">Показати товари</Button></DialogClose>
      </SheetContent>
    </Dialog>
  );
}

export function SortSelect() {
  const { sp, update } = useParamsNav();
  return (
    <NativeSelect className="w-auto min-w-44" aria-label="Сортування" value={sp.get("sort") ?? "popular"} onChange={(e) => update((p) => p.set("sort", e.target.value))}>
      <option value="popular">Спочатку популярні</option>
      <option value="price_asc">Дешевші</option>
      <option value="price_desc">Дорожчі</option>
      <option value="new">Новинки</option>
      <option value="name">За назвою</option>
    </NativeSelect>
  );
}

export function ActiveFilterChips({ chips }: { chips: { label: string; param: string; value?: string }[] }) {
  const { update } = useParamsNav();
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <button key={c.param + (c.value ?? "")} onClick={() => update((p) => {
          if (c.param === "brand" && c.value) {
            const next = (p.get("brand") ?? "").split(",").filter((b) => b && b !== c.value);
            if (next.length) p.set("brand", next.join(","));
            else p.delete("brand");
          } else if (c.param === "a" && c.value) {
            const cur = p.getAll("a"); p.delete("a"); cur.filter((x) => x !== c.value).forEach((x) => p.append("a", x));
          } else p.delete(c.param);
        })} className="inline-flex cursor-pointer items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-semibold hover:bg-accent">
          {c.label} <X className="size-3" />
        </button>
      ))}
    </div>
  );
}
