"use client";

import * as React from "react";
import { Loader2, Search, Timer } from "lucide-react";
import type { StockStatus } from "@prisma/client";
import { pickProductsAction } from "@/server/actions/admin";
import type { PickedProduct } from "@/server/services/admin/products";
import { StockBadge } from "@/components/shared/status";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Таймер SLA для VIN-запиту: скільки минуло і чи прострочено. */
const TICK = 30000;
const subscribeClock = (cb: () => void) => {
  const t = setInterval(cb, TICK);
  return () => clearInterval(t);
};
// знімок стабільний у межах 30 с; на сервері — null, щоб не було розбіжності гідрації
const clockSnapshot = () => Math.floor(Date.now() / TICK) * TICK;
const serverClock = () => null;

export function SlaTimer({ createdAt, slaHours, done }: { createdAt: string; slaHours: number; done?: boolean }) {
  const now = React.useSyncExternalStore(subscribeClock, clockSnapshot, serverClock);
  if (now === null) return <span className="inline-flex h-6 w-20 animate-pulse rounded bg-muted" />;
  const elapsed = (now - new Date(createdAt).getTime()) / 60000;
  const left = slaHours * 60 - elapsed;
  const overdue = left < 0;
  const fmt = (m: number) => {
    const a = Math.abs(Math.round(m));
    return a >= 60 ? `${Math.floor(a / 60)} год ${a % 60} хв` : `${a} хв`;
  };
  if (done) return <span className="text-xs text-muted-foreground">за {fmt(elapsed)}</span>;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 font-num text-xs font-bold whitespace-nowrap", overdue ? "bg-danger/15 text-danger" : left < 30 ? "bg-warning/15 text-warning" : "bg-success/15 text-success")}>
      <Timer className="size-3.5" /> {overdue ? `прострочено ${fmt(left)}` : `лишилось ${fmt(left)}`}
    </span>
  );
}

/** Пошук товару для вибору: замовлення, відповідь на VIN-запит, комплект ТО. */
export function ProductPicker({ onPick, placeholder = "Пошук товару: артикул, OE, назва…", autoFocus }: { onPick: (p: PickedProduct) => void; placeholder?: string; autoFocus?: boolean }) {
  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState<PickedProduct[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const box = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (q.trim().length < 2) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await pickProductsAction(q);
      if (!cancelled) { setItems(res); setLoading(false); setOpen(true); }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={box} className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input value={q} autoFocus={autoFocus} onChange={(e) => setQ(e.target.value)} onFocus={() => items.length && setOpen(true)} placeholder={placeholder} aria-label="Пошук товару"
        className="h-10 w-full rounded-md border border-input bg-card pr-9 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40" />
      {loading && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      {open && q.trim().length >= 2 && (
        <ul className="absolute inset-x-0 top-full z-40 mt-1 max-h-80 overflow-y-auto rounded-lg border bg-popover p-1 shadow-xl">
          {items.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => { onPick(p); setOpen(false); setQ(""); setItems([]); }} className={cn("flex w-full cursor-pointer items-start justify-between gap-3 rounded-md px-2.5 py-2 text-left hover:bg-accent", !p.isActive && "opacity-50")}>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                  <span className="text-xs text-muted-foreground"><span className="font-num text-foreground/80">{p.article}</span> · {p.brand}{p.oe.length ? ` · OE ${p.oe.slice(0, 2).join(", ")}` : ""}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-sm font-bold tabular-nums">{formatPrice(p.price)}</span>
                  <StockBadge status={p.stockStatus as StockStatus} qty={p.stockQty} />
                </span>
              </button>
            </li>
          ))}
          {!items.length && !loading && <li className="px-3 py-3 text-sm text-muted-foreground">Нічого не знайдено</li>}
        </ul>
      )}
    </div>
  );
}

/** Стовпчикова діаграма виручки по днях: один ряд, підказка при наведенні, таблиця як альтернатива. */
export function SalesChart({ data }: { data: { date: string; revenue: number; count: number }[] }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const W = 720, H = 220, padL = 44, padB = 22, padT = 10;
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const slot = (W - padL) / data.length;
  const bw = Math.min(24, slot - 2);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / top);
  const compact = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}K` : String(v));
  const h = hover != null ? data[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Виручка по днях">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">{compact(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + i * slot + (slot - bw) / 2;
          const bh = Math.max(0, y(0) - y(d.revenue));
          const r = Math.min(4, bh);
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + i * slot} y={padT} width={slot} height={H - padT - padB} fill="transparent" />
              {bh > 0 && (
                <path d={`M${x},${y(0)} V${y(0) - bh + r} Q${x},${y(0) - bh} ${x + r},${y(0) - bh} H${x + bw - r} Q${x + bw},${y(0) - bh} ${x + bw},${y(0) - bh + r} V${y(0)} Z`}
                  fill="var(--chart-1)" opacity={hover == null || hover === i ? 1 : 0.45} />
              )}
              {(i % 5 === 0 || i === data.length - 1) && (
                <text x={padL + i * slot + slot / 2} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">{d.date.slice(8, 10)}.{d.date.slice(5, 7)}</text>
              )}
            </g>
          );
        })}
      </svg>
      {h && hover != null && (
        <div className="pointer-events-none absolute top-0 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-lg" style={{ left: `clamp(0px, calc(${((padL + hover * slot + slot / 2) / W) * 100}% - 60px), calc(100% - 130px))` }}>
          <p className="font-semibold">{h.date.slice(8, 10)}.{h.date.slice(5, 7)}.{h.date.slice(0, 4)}</p>
          <p className="tabular-nums">{formatPrice(h.revenue)} · {h.count} зам.</p>
        </div>
      )}
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-muted-foreground">Таблиця даних</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead><tr className="text-muted-foreground"><th className="py-1">Дата</th><th>Замовлень</th><th className="text-right">Виручка</th></tr></thead>
          <tbody>{data.filter((d) => d.count).map((d) => <tr key={d.date} className="border-t"><td className="py-1">{d.date}</td><td>{d.count}</td><td className="text-right">{formatPrice(d.revenue)}</td></tr>)}</tbody>
        </table>
      </details>
    </div>
  );
}

function niceStep(max: number) {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}
