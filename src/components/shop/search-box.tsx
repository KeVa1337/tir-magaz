"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderTree, Loader2, ScanLine, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { Kbd } from "@/components/ui/misc";
import { FitBadge, type FitStatusValue } from "@/components/shared/status";

interface Suggest {
  vinCandidate: boolean;
  norm: string;
  categories: { name: string; slug: string }[];
  products: { slug: string; name: string; article: string; brand: string; price: number; match: string; matchedNumber?: string; fit: FitStatusValue | null }[];
}

/** Один рядок пошуку: артикул, OE/крос-номер, VIN або назва (SPEC §2.7, §10). Гаряча клавіша «/». */
export function SearchBox({ size = "default", autoFocus, defaultValue = "", className }: { size?: "default" | "hero"; autoFocus?: boolean; defaultValue?: string; className?: string }) {
  const router = useRouter();
  const [q, setQ] = React.useState(defaultValue);
  const [data, setData] = React.useState<Suggest | null>(null);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();

  React.useEffect(() => {
    if (size === "hero") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [size]);

  React.useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        setData(await res.json());
        setActive(-1);
      } catch {
        /* скасовано */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const links: string[] = [];
  if (data?.vinCandidate) links.push(`/vin?vin=${data.norm}`);
  data?.categories.forEach((c) => links.push(`/catalog/${c.slug}`));
  data?.products.forEach((p) => links.push(`/product/${p.slug}`));

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && links[active]) return go(links[active]);
    const term = q.trim();
    if (term) go(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !links.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % links.length); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? links.length - 1 : a - 1)); }
    if (e.key === "Escape") setOpen(false);
  };

  const hero = size === "hero";
  let idx = -1;
  const showDrop = open && q.trim().length >= 2 && !!data;

  return (
    <div ref={boxRef} className={cn("relative w-full", className)}>
      <form onSubmit={onSubmit} role="search">
        <label htmlFor={`${listId}-input`} className="sr-only">Пошук запчастин</label>
        <Search className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground", hero ? "left-5 size-6" : "left-3 size-4.5")} />
        <input
          ref={inputRef}
          id={`${listId}-input`}
          value={q}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={showDrop}
          aria-controls={listId}
          placeholder={hero ? "Артикул, OE-номер, VIN або назва деталі" : "Номер деталі, VIN або назва…"}
          className={cn(
            "w-full rounded-xl border border-input bg-card outline-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
            hero ? "h-16 pr-36 pl-14 text-lg shadow-lg sm:h-[72px] sm:text-xl" : "h-11 pr-20 pl-10 text-base sm:text-sm",
          )}
        />
        <div className={cn("absolute top-1/2 flex -translate-y-1/2 items-center gap-1.5", hero ? "right-2.5" : "right-2")}>
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          {q && (
            <button type="button" onClick={() => { setQ(""); inputRef.current?.focus(); }} className="rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Очистити">
              <X className="size-4" />
            </button>
          )}
          {hero ? (
            <button type="submit" className="h-11 cursor-pointer rounded-lg bg-primary px-5 font-bold text-primary-foreground hover:brightness-105 sm:h-13 sm:px-6">Знайти</button>
          ) : (
            <Kbd className="hidden sm:inline-flex">/</Kbd>
          )}
        </div>
      </form>

      {showDrop && (
        <div id={listId} role="listbox" className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-2xl">
          {data.vinCandidate && (
            <Link href={`/vin?vin=${data.norm}`} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 border-b bg-primary/10 px-4 py-3 hover:bg-primary/15", active === ++idx && "bg-primary/20")}>
              <ScanLine className="size-5 text-primary" />
              <span className="text-sm">Схоже на VIN — <b>розшифрувати</b> <span className="font-num">{data.norm}</span></span>
            </Link>
          )}
          {data.categories.length > 0 && (
            <div className="border-b p-2">
              {data.categories.map((c) => (
                <Link key={c.slug} href={`/catalog/${c.slug}`} onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent", active === ++idx && "bg-accent")}>
                  <FolderTree className="size-4 text-muted-foreground" /> {c.name}
                </Link>
              ))}
            </div>
          )}
          {data.products.length ? (
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {data.products.map((p) => (
                <Link key={p.slug} href={`/product/${p.slug}`} onClick={() => setOpen(false)} className={cn("flex items-start justify-between gap-3 rounded-md px-2 py-2 hover:bg-accent", active === ++idx && "bg-accent")}>
                  <span className="min-w-0">
                    <span className="line-clamp-1 text-sm font-semibold">{p.name}</span>
                    <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span className="font-num text-foreground/80">{p.article}</span> · {p.brand}
                      {p.match === "oe" && p.matchedNumber && <span className="text-info">аналог для OE {p.matchedNumber}</span>}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-bold tabular-nums">{formatPrice(p.price)}</span>
                    {p.fit && <FitBadge status={p.fit} className="text-[10px]" />}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            !data.vinCandidate && <p className="px-4 py-5 text-sm text-muted-foreground">Нічого не знайдено. Спробуйте інший номер або <Link className="font-semibold text-foreground underline" href="/vin">надішліть VIN-запит</Link>.</p>
          )}
          <button type="button" onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)} className="w-full cursor-pointer border-t px-4 py-2.5 text-left text-sm font-semibold hover:bg-accent">
            Усі результати для «{q.trim()}» →
          </button>
        </div>
      )}
    </div>
  );
}
