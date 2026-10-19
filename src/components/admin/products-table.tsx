"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type RowSelectionState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ImageOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { StockStatus } from "@prisma/client";
import { bulkProductsAction, inlineProductAction } from "@/server/actions/admin";
import type { AdminProductRow } from "@/server/services/admin/products";
import { StockBadge } from "@/components/shared/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, NativeSelect } from "@/components/ui/input";
import { STOCK_STATUS } from "@/lib/labels";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Інлайн-редагування числа: Enter — зберегти, Esc — скасувати. */
function InlineNumber({ id, field, value, display }: { id: string; field: "price" | "stockQty"; value: number; display: string }) {
  const [editing, setEditing] = React.useState(false);
  const [v, setV] = React.useState(String(value));
  const [pending, start] = React.useTransition();
  const save = () =>
    start(async () => {
      const n = Number(v.replace(",", "."));
      if (n === value) return setEditing(false);
      const r = await inlineProductAction(id, field, n);
      if (r.ok) { toast.success(field === "price" ? "Ціну оновлено" : "Залишок оновлено"); setEditing(false); } else toast.error(r.error);
    });
  if (!editing)
    return (
      <button onClick={() => { setV(String(value)); setEditing(true); }} className="cursor-pointer rounded px-1.5 py-0.5 font-num tabular-nums hover:bg-accent hover:ring-1 hover:ring-border" title="Клікніть, щоб змінити">
        {display}
      </button>
    );
  return (
    <span className="inline-flex items-center gap-1">
      <Input autoFocus value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} onBlur={() => !pending && setEditing(false)}
        className="h-7 w-24 px-2 text-right font-num" aria-label={field === "price" ? "Ціна" : "Залишок"} inputMode="decimal" />
      <Button size="icon-sm" className="size-7" onMouseDown={(e) => e.preventDefault()} onClick={save} disabled={pending} aria-label="Зберегти">{pending ? <Loader2 className="animate-spin" /> : <Check />}</Button>
    </span>
  );
}

function SortHeader({ label, field }: { label: string; field: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const active = sp.get("sort") === field;
  const dir = active && sp.get("dir") === "desc" ? "desc" : "asc";
  return (
    <button className="inline-flex cursor-pointer items-center gap-1 uppercase hover:text-foreground" onClick={() => {
      const p = new URLSearchParams(sp.toString());
      p.set("sort", field);
      p.set("dir", active && dir === "asc" ? "desc" : "asc");
      p.delete("page");
      router.push(`${pathname}?${p}`);
    }}>
      {label} {active ? (dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
    </button>
  );
}

export function ProductsTable({ rows, categories }: { rows: AdminProductRow[]; categories: { id: string; name: string; parent?: string | null }[] }) {
  const [selection, setSelection] = React.useState<RowSelectionState>({});
  const [pending, start] = React.useTransition();
  const [bulk, setBulk] = React.useState("pricePercent");
  const [bulkValue, setBulkValue] = React.useState("");

  const columns = React.useMemo<ColumnDef<AdminProductRow>[]>(() => [
    {
      id: "select",
      header: ({ table }) => <Checkbox aria-label="Обрати всі" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }) => <Checkbox aria-label="Обрати" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
    },
    { accessorKey: "sku", header: () => <SortHeader label="Код" field="sku" />, cell: ({ getValue }) => <span className="font-num text-xs text-muted-foreground">{getValue<string>()}</span> },
    { accessorKey: "article", header: () => <SortHeader label="Артикул" field="article" />, cell: ({ getValue }) => <span className="font-num text-xs font-semibold whitespace-nowrap">{getValue<string>()}</span> },
    {
      accessorKey: "name", header: () => <SortHeader label="Назва" field="name" />,
      cell: ({ row }) => (
        <span className="block max-w-80">
          <Link href={`/admin/products/${row.original.id}`} className="line-clamp-2 font-semibold hover:underline">{row.original.name}</Link>
          <span className="text-xs text-muted-foreground">{row.original.brand} · {row.original.category}</span>
        </span>
      ),
    },
    { accessorKey: "price", header: () => <SortHeader label="Ціна" field="price" />, cell: ({ row }) => <InlineNumber id={row.original.id} field="price" value={row.original.price} display={formatPrice(row.original.price)} /> },
    { accessorKey: "stockQty", header: () => <SortHeader label="Залишок" field="stockQty" />, cell: ({ row }) => <InlineNumber id={row.original.id} field="stockQty" value={row.original.stockQty} display={String(row.original.stockQty)} /> },
    { accessorKey: "stockStatus", header: "Наявність", cell: ({ row }) => <StockBadge status={row.original.stockStatus} /> },
    {
      id: "quality", header: "Дані",
      cell: ({ row }) => (
        <span className="flex flex-wrap gap-1">
          {!row.original.images && <Badge tone="amber" title="Немає фото"><ImageOff /></Badge>}
          <Badge tone={row.original.fitments ? "neutral" : "amber"} title="Правил застосовності">{row.original.fitments} заст.</Badge>
          <Badge title="Номерів OE/крос">{row.original.numbers} №</Badge>
        </span>
      ),
    },
    { accessorKey: "isActive", header: "Активний", cell: ({ getValue }) => (getValue<boolean>() ? <Badge tone="green">так</Badge> : <Badge tone="red">ні</Badge>) },
  ], []);

  const table = useReactTable({ data: rows, columns, state: { rowSelection: selection }, onRowSelectionChange: setSelection, getRowId: (r) => r.id, getCoreRowModel: getCoreRowModel(), enableRowSelection: true });
  const ids = Object.keys(selection).filter((k) => selection[k]);

  const applyBulk = () =>
    start(async () => {
      let action: Parameters<typeof bulkProductsAction>[1];
      if (bulk === "pricePercent") {
        const n = Number(bulkValue.replace(",", "."));
        if (!Number.isFinite(n) || !n) return void toast.error("Вкажіть відсоток, напр. 5 або -10");
        action = { type: "pricePercent", value: n };
      } else if (bulk === "stockStatus") action = { type: "stockStatus", value: (bulkValue || "IN_STOCK") as StockStatus };
      else if (bulk === "category") {
        if (!bulkValue) return void toast.error("Оберіть категорію");
        action = { type: "category", value: bulkValue };
      } else if (bulk === "activate") action = { type: "activate", value: true };
      else if (bulk === "deactivate") action = { type: "activate", value: false };
      else action = { type: "popular", value: bulk === "popular" };
      const r = await bulkProductsAction(ids, action);
      if (r.ok) { toast.success(`Оновлено товарів: ${ids.length}`); setSelection({}); setBulkValue(""); } else toast.error(r.error);
    });

  return (
    <div className="grid gap-3">
      {ids.length > 0 && (
        <div className="sticky top-14 z-20 flex flex-wrap items-center gap-2 rounded-lg border border-primary/50 bg-card p-2.5 shadow-lg">
          <span className="px-1 text-sm font-bold">Обрано: {ids.length}</span>
          <NativeSelect value={bulk} onChange={(e) => { setBulk(e.target.value); setBulkValue(""); }} className="h-9 w-auto" aria-label="Масова дія">
            <option value="pricePercent">Змінити ціну на %</option>
            <option value="stockStatus">Встановити наявність</option>
            <option value="category">Перенести в категорію</option>
            <option value="activate">Активувати</option>
            <option value="deactivate">Деактивувати</option>
            <option value="popular">Позначити «популярні»</option>
            <option value="unpopular">Зняти «популярні»</option>
          </NativeSelect>
          {bulk === "pricePercent" && <Input value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="+5 або -10" className="h-9 w-28" aria-label="Відсоток" />}
          {bulk === "stockStatus" && (
            <NativeSelect value={bulkValue || "IN_STOCK"} onChange={(e) => setBulkValue(e.target.value)} className="h-9 w-auto" aria-label="Наявність">
              {(Object.keys(STOCK_STATUS) as StockStatus[]).map((s) => <option key={s} value={s}>{STOCK_STATUS[s].label}</option>)}
            </NativeSelect>
          )}
          {bulk === "category" && (
            <NativeSelect value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="h-9 w-auto" aria-label="Категорія">
              <option value="">— категорія —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.parent ? `${c.parent} › ` : ""}{c.name}</option>)}
            </NativeSelect>
          )}
          <Button size="sm" className="h-9" onClick={applyBulk} disabled={pending}>{pending && <Loader2 className="animate-spin" />} Застосувати</Button>
          <Button size="sm" variant="ghost" className="h-9" onClick={() => setSelection({})}>Скасувати</Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>{hg.headers.map((h) => <th key={h.id} className="h-9 px-3 text-left text-xs font-semibold whitespace-nowrap text-muted-foreground uppercase">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id} className={cn("border-b last:border-0 hover:bg-muted/40", r.getIsSelected() && "bg-primary/5", !r.original.isActive && "opacity-60")}>
                {r.getVisibleCells().map((c) => <td key={c.id} className="px-3 py-2 align-middle">{flexRender(c.column.columnDef.cell, c.getContext())}</td>)}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={columns.length} className="py-10 text-center text-muted-foreground">Товарів не знайдено</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
