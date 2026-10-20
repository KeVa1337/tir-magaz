import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MessageSquareText, ShieldCheck, Truck, Wrench } from "lucide-react";
import { getAnalogs, getProductBySlug } from "@/server/services/catalog";
import { evaluateFit } from "@/server/services/fitment";
import { getShopContext } from "@/server/context";
import { Breadcrumbs, Price } from "@/components/shared/misc";
import { ProductImage } from "@/components/shared/icons";
import { PartNumber } from "@/components/shared/part-number";
import { FitBadge, StockBadge } from "@/components/shared/status";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/shop/add-to-cart";
import { QuickOrderButton } from "@/components/shop/quick-forms";
import { FavButton, RecentTracker } from "@/components/shop/favorites";
import { ProductGrid } from "@/components/shop/product-card";
import { formatPrice, toNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  return {
    title: p.seoTitle ?? `${p.name} ${p.brand.name} ${p.article}`,
    description: p.seoDescription ?? `${p.name}. Артикул ${p.article}, виробник ${p.brand.name}. ${p.numbers.filter((n) => n.type === "OE").map((n) => `OE ${n.number}`).join(", ")}`,
    alternates: { canonical: `/product/${p.slug}` },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p || !p.isActive) notFound();
  const { ctx } = await getShopContext();
  const fit = ctx ? evaluateFit(p, ctx) : null;
  const analogs = await getAnalogs(p, ctx);
  const oe = p.numbers.filter((n) => n.type === "OE");
  const cross = p.numbers.filter((n) => n.type === "CROSS");
  const price = toNumber(p.price);
  const oldPrice = p.oldPrice ? toNumber(p.oldPrice) : null;
  const unavailable = p.stockStatus === "OUT_OF_STOCK" && !p.offers.length;
  const ownAvailable = p.stockStatus === "IN_STOCK" || p.stockStatus === "LOW";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    mpn: p.article,
    brand: { "@type": "Brand", name: p.brand.name },
    description: p.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "UAH",
      price: price.toFixed(2),
      availability: unavailable ? "https://schema.org/OutOfStock" : p.stockStatus === "ON_ORDER" ? "https://schema.org/BackOrder" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <RecentTracker productId={p.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[
        { label: "Каталог", href: "/catalog" },
        ...(p.category.parent ? [{ label: p.category.parent.name, href: `/catalog/${p.category.parent.slug}` }] : []),
        { label: p.category.name, href: p.category.parent ? `/catalog/${p.category.parent.slug}/${p.category.slug}` : `/catalog/${p.category.slug}` },
        { label: p.article },
      ]} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10">
        <div className="grid gap-3">
          <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-card">
            <ProductImage src={p.images[0]?.url} alt={p.name} icon={p.category.icon} kind={p.category.slug} />
          </div>
          {p.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {p.images.slice(1, 6).map((img) => (
                <div key={img.id} className="aspect-square overflow-hidden rounded-lg border bg-card"><ProductImage src={img.url} alt={img.alt ?? p.name} /></div>
              ))}
            </div>
          )}
        </div>

        <div className="grid content-start gap-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone={p.brand.isOriginal ? "primary" : "outline"}>{p.brand.name}{p.brand.isOriginal && " · оригінал"}</Badge>
              {p.isUniversal && <Badge tone="blue">Універсальна позиція</Badge>}
              <FavButton productId={p.id} withLabel className="ml-auto" />
            </div>
            <h1 className="text-2xl leading-tight font-extrabold sm:text-3xl">{p.name}</h1>
            <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Артикул</dt>
              <dd><PartNumber value={p.article} size="base" className="font-bold" /></dd>
              <dt className="text-muted-foreground">Код товару</dt>
              <dd><PartNumber value={p.sku} /></dd>
              {oe[0] && <><dt className="text-muted-foreground">OE-номер</dt><dd><PartNumber value={oe[0].number} /> <span className="text-xs text-muted-foreground">{oe[0].brandName}</span></dd></>}
            </dl>
          </div>

          {fit ? (
            <div className={cn("rounded-xl border p-4", { fits: "border-success/40 bg-success/10", maybe: "border-warning/40 bg-warning/10", no: "border-danger/40 bg-danger/10" }[fit.status])}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">
                  {fit.status === "fits" ? "Підходить до" : fit.status === "maybe" ? "Можливо підходить до" : "Не підходить до"} вашого {ctx!.shortLabel}
                </p>
                <FitBadge status={fit.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{fit.reason}{fit.position ? ` · ${fit.position}` : ""}{fit.note ? ` · ${fit.note}` : ""}</p>
              {fit.status !== "fits" && (
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href={ctx?.vehicleId ? `/account/vin-requests/new?vehicle=${ctx.vehicleId}&product=${p.slug}` : `/vin?product=${p.slug}`}><MessageSquareText /> Уточнити у менеджера</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-sm">
              <p className="font-semibold">Перевірте сумісність</p>
              <p className="mt-1 text-muted-foreground">Оберіть «Моє авто» у шапці сайту або <Link href="/vin" className="font-semibold text-foreground underline">введіть VIN</Link> — покажемо, чи підходить деталь.</p>
            </div>
          )}

          <div className="grid gap-4 rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <Price value={price} old={oldPrice} size="xl" />
              {!ownAvailable && p.offers.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold"><span className="size-2 rounded-full bg-info" />У партнерів, від {p.offers[0].leadDays} дн.</span>
              ) : (
                <StockBadge status={p.stockStatus} qty={p.stockQty} leadTimeDays={p.leadTimeDays} className="text-sm" />
              )}
            </div>
            <AddToCartButton productId={p.id} withQty size="lg" disabled={unavailable} label={unavailable ? "Немає в наявності" : "Додати в кошик"} />
            <QuickOrderButton productId={p.id} name={p.name} price={ownAvailable || !p.offers.length ? price : toNumber(p.offers[0].price)} disabled={unavailable} />
            {!ownAvailable && p.offers.length > 0 && (
              <p className="text-xs text-muted-foreground">На власному складі немає — додамо найшвидшу пропозицію партнера ({p.offers[0].leadDays} дн.).</p>
            )}
            <ul className="grid gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Truck className="size-4 text-primary" /> Відправка Новою Поштою в день замовлення до 16:00</li>
              <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Гарантія виробника, повернення 14 днів</li>
              {p.kitItems.length > 0 && (
                <li className="flex items-center gap-2"><Wrench className="size-4 text-primary" /> Входить у комплект: {p.kitItems.map((k, i) => <span key={k.kit.slug}>{i > 0 && ", "}<Link className="font-semibold text-foreground underline" href={`/kits/${k.kit.slug}`}>{k.kit.name}</Link></span>)}</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {p.offers.length > 0 && (
        <section className="mt-10 rounded-xl border bg-card">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b p-4">
            <h2 className="text-lg font-extrabold">Наявність і ціни на складах</h2>
            <p className="text-sm text-muted-foreground">Оберіть, звідки відвантажити: швидше чи дешевше</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-xs text-muted-foreground uppercase">
                <tr><th className="px-4 py-2 text-left">Склад</th><th className="px-4 py-2 text-left">Наявність</th><th className="px-4 py-2 text-left">Відправка</th><th className="px-4 py-2 text-right">Ціна</th><th className="px-4 py-2" /></tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 font-semibold">Власний склад · Київ</td>
                  <td className="px-4 py-3"><StockBadge status={p.stockStatus} qty={p.stockQty} leadTimeDays={p.leadTimeDays} /></td>
                  <td className="px-4 py-3">{ownAvailable ? <b className="text-success">сьогодні</b> : p.leadTimeDays ? `${p.leadTimeDays} дн.` : "—"}</td>
                  <td className="px-4 py-3 text-right font-bold whitespace-nowrap tabular-nums">{formatPrice(price)}</td>
                  <td className="px-4 py-3 text-right">{p.stockStatus !== "OUT_OF_STOCK" && <AddToCartButton productId={p.id} offerId={null} size="sm" variant="outline" />}</td>
                </tr>
                {p.offers.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{o.warehouse} · {o.city}</td>
                    <td className="px-4 py-3 tabular-nums">{o.qty} шт.</td>
                    <td className="px-4 py-3">{o.leadDays} {o.leadDays === 1 ? "день" : o.leadDays < 5 ? "дні" : "днів"}</td>
                    <td className="px-4 py-3 text-right font-bold whitespace-nowrap tabular-nums">{formatPrice(o.price)}</td>
                    <td className="px-4 py-3 text-right"><AddToCartButton productId={p.id} offerId={o.id} size="sm" variant="outline" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Tabs defaultValue="fitment" className="mt-10">
        <TabsList>
          <TabsTrigger value="fitment">Застосовність ({p.fitments.length})</TabsTrigger>
          <TabsTrigger value="numbers">OE і крос-номери ({p.numbers.length})</TabsTrigger>
          <TabsTrigger value="specs">Характеристики</TabsTrigger>
          <TabsTrigger value="desc">Опис</TabsTrigger>
        </TabsList>
        <TabsContent value="fitment">
          {p.fitments.length ? (
            <div className="rounded-xl border bg-card">
              <Table>
                <THead><TR><TH>Марка</TH><TH>Серія</TH><TH>Двигун</TH><TH>Роки</TH><TH>Шасі</TH><TH>Позиція</TH><TH>Примітка</TH>{ctx && <TH>Ваше авто</TH>}</TR></THead>
                <TBody>
                  {p.fitments.map((f) => {
                    const one = ctx ? evaluateFit({ ...p, numbers: [], isUniversal: false, fitments: [f] }, { ...ctx, oeNumbers: [] }) : null;
                    return (
                      <TR key={f.id}>
                        <TD className="font-semibold">{f.make?.name ?? (f.axleBrand ? `Осі ${f.axleBrand}` : "—")}</TD>
                        <TD>{f.series?.name ?? "усі"}</TD>
                        <TD className="font-num text-xs">{f.engineCode?.code ?? "усі"}</TD>
                        <TD className="tabular-nums">{f.yearFrom || f.yearTo ? `${f.yearFrom ?? "…"}–${f.yearTo ?? "…"}` : "—"}</TD>
                        <TD className="font-num text-xs">{f.chassisFrom || f.chassisTo ? `${f.chassisFrom ?? "…"} – ${f.chassisTo ?? "…"}` : "—"}</TD>
                        <TD>{f.position ?? "—"}</TD>
                        <TD className="text-muted-foreground">{f.note ?? ""}</TD>
                        {one && <TD><FitBadge status={one.status} title={one.reason} /></TD>}
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground">{p.isUniversal ? "Універсальна позиція — підходить для більшості тягачів. Перевірте допуски виробника." : "Даних про застосовність немає — уточніть у менеджера за VIN."}</p>
          )}
        </TabsContent>
        <TabsContent value="numbers">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-sm font-bold">Оригінальні номери (OE)</p>
              {oe.length ? (
                <ul className="grid gap-1.5">{oe.map((n) => <li key={n.id} className="flex items-center justify-between gap-2"><PartNumber value={n.number} /><span className="text-xs text-muted-foreground">{n.brandName}</span></li>)}</ul>
              ) : p.brand.isOriginal ? <p className="text-sm text-muted-foreground">Це оригінальна деталь — артикул і є OE-номером.</p> : <p className="text-sm text-muted-foreground">—</p>}
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-sm font-bold">Крос-номери (аналоги інших виробників)</p>
              {cross.length ? (
                <ul className="grid gap-1.5">{cross.map((n) => <li key={n.id} className="flex items-center justify-between gap-2"><PartNumber value={n.number} /><span className="text-xs text-muted-foreground">{n.brandName}</span></li>)}</ul>
              ) : <p className="text-sm text-muted-foreground">—</p>}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="specs">
          <div className="max-w-2xl rounded-xl border bg-card">
            <Table>
              <TBody>
                <TR><TD className="w-1/2 text-muted-foreground">Виробник</TD><TD className="font-semibold">{p.brand.name}{p.brand.country ? ` (${p.brand.country})` : ""}</TD></TR>
                {p.attributes.map((a) => <TR key={a.id}><TD className="text-muted-foreground">{a.name}</TD><TD className="font-semibold">{a.value}</TD></TR>)}
                {p.weightKg && <TR><TD className="text-muted-foreground">Вага, кг</TD><TD className="font-semibold tabular-nums">{toNumber(p.weightKg)}</TD></TR>}
              </TBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="desc">
          <p className="max-w-3xl leading-relaxed text-foreground/90">{p.description ?? "Опис відсутній."}</p>
        </TabsContent>
      </Tabs>

      {analogs.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-extrabold">Аналоги та замінники <span className="text-muted-foreground">({analogs.length})</span></h2>
          <ProductGrid items={analogs} />
        </section>
      )}
    </div>
  );
}
