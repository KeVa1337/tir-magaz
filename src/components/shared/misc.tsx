import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

export function Price({ value, old, className, size = "base" }: { value: number; old?: number | null; className?: string; size?: "sm" | "base" | "lg" | "xl" }) {
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-extrabold tabular-nums", { sm: "text-sm", base: "text-lg", lg: "text-2xl", xl: "text-3xl" }[size])}>{formatPrice(value)}</span>
      {old && old > value ? <span className="text-sm text-muted-foreground tabular-nums line-through">{formatPrice(old)}</span> : null}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, text, children, className }: { icon?: LucideIcon; title: string; text?: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-grid flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center", className)}>
      {Icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
          <Icon className="size-7 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="mt-1 max-w-md text-sm text-muted-foreground">{text}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

export function PageHeader({ title, description, children, className }: { title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Навігація" className="scrollbar-none mb-4 flex items-center gap-1.5 overflow-x-auto text-sm whitespace-nowrap text-muted-foreground">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3.5 opacity-60" />}
          {it.href ? <Link href={it.href} className="hover:text-foreground">{it.label}</Link> : <span className="text-foreground">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

/** Пагінація через searchParams. */
export function Pagination({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums: (number | "…")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const cls = "inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-semibold";
  return (
    <nav aria-label="Сторінки" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 && <Link href={makeHref(page - 1)} className={cn(cls, "hover:bg-accent")} aria-label="Попередня"><ChevronLeft className="size-4" /></Link>}
      {nums.map((n, i) =>
        n === "…" ? <span key={`e${i}`} className="px-1 text-muted-foreground">…</span> : (
          <Link key={n} href={makeHref(n)} aria-current={n === page ? "page" : undefined} className={cn(cls, n === page ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}>{n}</Link>
        ),
      )}
      {page < pages && <Link href={makeHref(page + 1)} className={cn(cls, "hover:bg-accent")} aria-label="Наступна"><ChevronRight className="size-4" /></Link>}
    </nav>
  );
}

/** Мінімальний рендер контенту сторінок: ## заголовки, списки, **жирний**, > цитати. */
export function RichText({ content, className }: { content: string; className?: string }) {
  const blocks = content.split(/\n{2,}/);
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part));
  return (
    <div className={cn("prose-tir", className)}>
      {blocks.map((b, i) => {
        const t = b.trim();
        if (t.startsWith("## ")) return <h2 key={i}>{t.slice(3)}</h2>;
        if (t.startsWith("> ")) return <blockquote key={i}>{inline(t.replace(/^> ?/gm, ""))}</blockquote>;
        if (/^- /m.test(t) && t.split("\n").every((l) => l.startsWith("- ")))
          return <ul key={i}>{t.split("\n").map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
        return <p key={i}>{inline(t)}</p>;
      })}
    </div>
  );
}
