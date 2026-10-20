"use client";

import * as React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useLocalList } from "@/lib/local-lists";
import type { ProductCardDTO } from "@/server/services/catalog";
import { ProductGrid } from "./product-card";
import { EmptyState } from "@/components/shared/misc";
import { GridSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";

function useProducts(ids: string[]) {
  const key = ids.join(",");
  const [state, setState] = React.useState<{ key: string; items: ProductCardDTO[] } | null>(null);
  React.useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    fetch(`/api/products/by-ids?ids=${encodeURIComponent(key)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((items: ProductCardDTO[]) => setState({ key, items }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [key]);
  if (!key) return { items: [] as ProductCardDTO[], loading: false };
  return { items: state?.key === key ? state.items : [], loading: state?.key !== key };
}

export function SavedLists() {
  const fav = useLocalList("tir-fav");
  const recent = useLocalList("tir-recent");
  const favs = useProducts(fav);
  const rec = useProducts(recent.filter((id) => !fav.includes(id)).slice(0, 8));
  return (
    <div className="grid gap-10">
      <section>
        <h2 className="mb-4 text-xl font-extrabold">Обране {fav.length > 0 && <span className="text-muted-foreground">({fav.length})</span>}</h2>
        {!fav.length ? (
          <EmptyState icon={Heart} title="Тут поки порожньо" text="Натискайте ♡ на товарах, щоб зберегти їх для себе або механіка.">
            <Button asChild><Link href="/catalog">До каталогу</Link></Button>
          </EmptyState>
        ) : favs.loading ? <GridSkeleton count={Math.min(4, fav.length)} /> : <ProductGrid items={favs.items} />}
      </section>
      {recent.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-extrabold">Нещодавно переглянуті</h2>
          {rec.loading ? <GridSkeleton count={4} /> : <ProductGrid items={rec.items} />}
        </section>
      )}
    </div>
  );
}
