import Link from "next/link";
import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { getKits, kitTotal } from "@/server/services/catalog";
import { getShopContext } from "@/server/context";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";
import { FitBadge } from "@/components/shared/status";
import { AddKitButton } from "@/components/shop/add-to-cart";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Комплекти ТО для тягачів", description: "Готові комплекти для технічного обслуговування: фільтри, моторна олива, ремені під конкретний двигун." };

export default async function KitsPage() {
  const { ctx } = await getShopContext();
  const kits = await getKits();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Головна", href: "/" }, { label: "Комплекти ТО" }]} />
      <PageHeader title="Комплекти ТО" description="Усе для планового обслуговування під конкретний двигун — одним кліком у кошик" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kits.map((k) => {
          const fits = ctx?.makeId ? (k.makeId === ctx.makeId && (!k.seriesId || !ctx.seriesId || k.seriesId === ctx.seriesId) && (!k.engineCodeId || !ctx.engineCodeId || k.engineCodeId === ctx.engineCodeId) ? (ctx.engineCodeId && k.engineCodeId ? "fits" : "maybe") : "no") : null;
          return (
            <article key={k.id} className="flex min-w-0 flex-col rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary"><Wrench className="size-6" /></span>
                {fits && <FitBadge status={fits} />}
              </div>
              <h2 className="mt-3 text-lg font-extrabold"><Link href={`/kits/${k.slug}`} className="hover:underline">{k.name}</Link></h2>
              <p className="text-sm text-muted-foreground">{[k.make?.name, k.series?.name, k.engineCode?.code].filter(Boolean).join(" · ")}{k.intervalKm ? ` · кожні ${k.intervalKm.toLocaleString("uk-UA")} км` : ""}</p>
              <ul className="my-4 grid gap-1.5 text-sm">
                {k.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">{i.product.name}{i.qty > 1 ? ` × ${i.qty}` : ""}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">{formatPrice(Number(i.product.price) * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <span className="text-xl font-extrabold tabular-nums">{formatPrice(kitTotal(k.items))}</span>
                <AddKitButton kitId={k.id} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
