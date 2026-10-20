import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { SCHEMES } from "@/lib/schemes";
import { db } from "@/server/db";
import { listProducts } from "@/server/services/catalog";
import { getShopContext } from "@/server/context";
import { SchemeArt } from "@/components/shop/scheme-art";
import { ProductImage } from "@/components/shared/icons";
import { FitBadge, StockBadge } from "@/components/shared/status";
import { Breadcrumbs, Price } from "@/components/shared/misc";
import { AddToCartButton } from "@/components/shop/add-to-cart";
import { Button } from "@/components/ui/button";
import { first, type SP } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/schemes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = SCHEMES.find((x) => x.slug === slug);
  return s ? { title: s.title, description: s.description } : {};
}

export default async function SchemePage({ params, searchParams }: PageProps<"/schemes/[slug]">) {
  const { slug } = await params;
  const sp = (await searchParams) as SP;
  const scheme = SCHEMES.find((s) => s.slug === slug);
  if (!scheme) notFound();
  const part = scheme.parts.find((p) => String(p.n) === first(sp.part)) ?? scheme.parts[0];
  const { ctx } = await getShopContext();
  const cat = await db.category.findUnique({ where: { slug: part.category }, include: { parent: true } });
  const list = cat ? await listProducts({ categoryIds: [cat.id], onlyFit: !!ctx, perPage: 6, inStock: false }, ctx) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Схеми вузлів", href: "/schemes" }, { label: scheme.title }]} />
      <h1 className="text-2xl font-extrabold sm:text-3xl">{scheme.title}</h1>
      <p className="mt-1 mb-5 text-muted-foreground">Натисніть номер на схемі — праворуч з&apos;являться деталі{ctx ? ` для ${ctx.shortLabel}` : ""}.</p>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="grid content-start gap-3">
          <div className="bg-grid relative overflow-hidden rounded-xl border bg-card p-4">
            <SchemeArt slug={scheme.slug} className="h-auto w-full text-muted-foreground" />
            {scheme.parts.map((p) => (
              <Link key={p.n} href={`/schemes/${scheme.slug}?part=${p.n}`} scroll={false} aria-label={`${p.n}. ${p.label}`}
                style={{ left: `calc(${p.x}% )`, top: `calc(${p.y}% )` }}
                className={cn("absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-num text-base font-black shadow-lg transition-transform hover:scale-110 sm:size-11",
                  p.n === part.n ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/30" : "border-primary bg-card text-foreground")}>
                {p.n}
              </Link>
            ))}
          </div>
          <ol className="grid gap-1 sm:grid-cols-2">
            {scheme.parts.map((p) => (
              <li key={p.n}>
                <Link href={`/schemes/${scheme.slug}?part=${p.n}`} scroll={false} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm", p.n === part.n ? "bg-primary/15 font-bold" : "hover:bg-accent")}>
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary font-num text-xs font-black text-primary-foreground">{p.n}</span>{p.label}
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <aside className="grid content-start gap-3 rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-extrabold">{part.n}. {part.label}</h2>
            {cat && <Link href={`/catalog/${cat.parent ? `${cat.parent.slug}/` : ""}${cat.slug}${ctx ? "?fit=1" : ""}`} className="shrink-0 text-sm font-semibold text-primary hover:underline">Усі →</Link>}
          </div>
          {!ctx && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-3 text-sm">
              <span className="flex items-center gap-2"><Truck className="size-4 text-primary" /> Оберіть авто, щоб бачити лише сумісні</span>
              <Button asChild size="sm" variant="secondary"><Link href="/pidbir">Обрати авто</Link></Button>
            </div>
          )}
          {list?.items.length ? (
            <ul className="divide-y">
              {list.items.map((p) => (
                <li key={p.id} className="flex gap-3 py-3">
                  <Link href={`/product/${p.slug}`} className="size-16 shrink-0 overflow-hidden rounded-lg border"><ProductImage src={p.image} alt={p.name} kind={p.kind} icon={p.icon} /></Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${p.slug}`} className="line-clamp-2 text-sm font-semibold hover:underline">{p.name}</Link>
                    <p className="text-xs text-muted-foreground"><span className="font-num">{p.article}</span> · {p.brand}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">{p.fit && <FitBadge status={p.fit.status} />}<StockBadge status={p.stockStatus} qty={p.stockQty} /></div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Price value={p.price} size="sm" />
                    <AddToCartButton productId={p.id} size="sm" label="" disabled={p.stockStatus === "OUT_OF_STOCK" && !p.offers} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Для цієї моделі деталей у демо-каталозі немає — <Link href="/vin" className="underline">надішліть VIN-запит</Link>, менеджер підбере.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
