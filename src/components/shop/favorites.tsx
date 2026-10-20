"use client";

import * as React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { pushRecent, toggleInList, useLocalList } from "@/lib/local-lists";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FavButton({ productId, className, withLabel }: { productId: string; className?: string; withLabel?: boolean }) {
  const fav = useLocalList("tir-fav");
  const on = fav.includes(productId);
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleInList("tir-fav", productId); }}
      aria-pressed={on}
      aria-label={on ? "Прибрати з обраного" : "Додати в обране"}
      title={on ? "В обраному" : "В обране"}
      className={cn("inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full transition-colors", withLabel ? "h-10 px-3 text-sm font-semibold hover:bg-accent" : "size-9 bg-card/90 shadow backdrop-blur hover:bg-card", className)}
    >
      <Heart className={cn("size-4.5", on ? "fill-danger text-danger" : "text-muted-foreground")} />
      {withLabel && (on ? "В обраному" : "В обране")}
    </button>
  );
}

export function FavHeaderLink() {
  const fav = useLocalList("tir-fav");
  return (
    <Button asChild variant="ghost" size="icon" className="relative max-sm:hidden" aria-label={`Обране: ${fav.length}`}>
      <Link href="/favorites">
        <Heart className="size-5" />
        {fav.length > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-black text-white">{fav.length}</span>}
      </Link>
    </Button>
  );
}

export function RecentTracker({ productId }: { productId: string }) {
  React.useEffect(() => pushRecent(productId), [productId]);
  return null;
}

