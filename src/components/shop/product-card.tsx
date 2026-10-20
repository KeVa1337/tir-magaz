import Link from "next/link";
import type { ProductCardDTO } from "@/server/services/catalog";
import { ProductImage } from "@/components/shared/icons";
import { FitBadge, StockBadge } from "@/components/shared/status";
import { Price } from "@/components/shared/misc";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "./add-to-cart";
import { cn } from "@/lib/utils";

export function ProductCard({ p, note }: { p: ProductCardDTO; note?: React.ReactNode }) {
  const unavailable = p.stockStatus === "OUT_OF_STOCK";
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <Link href={`/product/${p.slug}`} className="relative aspect-[4/3] overflow-hidden border-b" tabIndex={-1} aria-hidden>
        <ProductImage src={p.image} alt={p.name} icon={p.icon} />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {p.isOriginal && <Badge tone="primary">Оригінал</Badge>}
          {p.oldPrice && p.oldPrice > p.price && <Badge tone="red">−{Math.round((1 - p.price / p.oldPrice) * 100)}%</Badge>}
        </div>
        {p.fit && <FitBadge status={p.fit.status} className="absolute right-2 bottom-2 bg-card/95 backdrop-blur" title={p.fit.reason} />}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-semibold text-muted-foreground uppercase">{p.brand}</span>
          <span className="truncate font-num text-foreground/80">{p.article}</span>
        </div>
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
          <Link href={`/product/${p.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {p.name}
          </Link>
        </h3>
        {note}
        <div className="mt-auto grid gap-2.5 pt-1">
          <StockBadge status={p.stockStatus} qty={p.stockQty} leadTimeDays={p.leadTimeDays} />
          <div className="flex items-end justify-between gap-2">
            <Price value={p.price} old={p.oldPrice} />
          </div>
          <AddToCartButton productId={p.id} disabled={unavailable} size="sm" className={cn("relative z-10 [&_button]:h-10 [&_button]:w-full")} label={unavailable ? "Немає" : "В кошик"} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ items, className }: { items: ProductCardDTO[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4", className)}>
      {items.map((p) => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}
