import Link from "next/link";
import { ArrowRight, Car, ClipboardCheck, Clock, Container, Database, Phone, ScanLine, ShieldCheck, Truck, Wrench } from "lucide-react";
import { getBanners, getCategoryTree, getFaq, getKits, getPopularProducts, getVehicleMakes, kitTotal } from "@/server/services/catalog";
import { getSettings } from "@/server/services/settings";
import { getShopContext } from "@/server/context";
import { SearchBox } from "@/components/shop/search-box";
import { ProductGrid } from "@/components/shop/product-card";
import { CategoryIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

export default async function HomePage() {
  const { ctx } = await getShopContext();
  const [banners, tree, makes, kits, popular, settings, faq] = await Promise.all([
    getBanners(), getCategoryTree(), getVehicleMakes(), getKits(), getPopularProducts(ctx, 8), getSettings(), getFaq(),
  ]);
  const tractors = makes.filter((m) => m.kind !== "TRAILER");
  const trailers = makes.filter((m) => m.kind === "TRAILER");

  return (
    <>
      <section className="bg-grid relative overflow-hidden border-b">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 pt-12 pb-14 text-center sm:pt-20 sm:pb-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
            <span className="size-2 animate-pulse rounded-full bg-primary" /> Тягачі · вантажівки · напівпричепи
          </p>
          <h1 className="text-4xl leading-[1.05] font-black sm:text-6xl">
            Запчастини для TIR <br className="max-sm:hidden" /><span className="text-primary">точно під ваше шасі</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Шукайте за артикулом, OE-номером чи VIN. Додайте свої авто в гараж — і каталог показуватиме тільки те, що підходить.
          </p>
          <SearchBox size="hero" className="mx-auto mt-8 max-w-3xl text-left" />
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>Наприклад:</span>
            {["колодки DAF XF", "пневмоподушка", "Mann HU", "фільтр паливний MAN"].map((q) => (
              <Link key={q} href={`/search?q=${encodeURIComponent(q)}`} className="font-semibold text-foreground/80 underline-offset-4 hover:underline">{q}</Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="xl"><Link href="/vin"><ScanLine /> Підібрати за VIN</Link></Button>
            <Button asChild size="xl" variant="outline"><Link href={ctx ? "/catalog?fit=1" : "/account/garage/new"}><Car /> {ctx ? `Деталі для ${ctx.shortLabel}` : "Підібрати під моє авто"}</Link></Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        {banners.length > 0 && (
          <section className="-mt-6 grid gap-3 md:grid-cols-3">
            {banners.map((b, i) => (
              <Link key={b.id} href={b.link ?? "#"} className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50">
                <span className="font-num text-xs text-primary">0{i + 1}</span>
                <h2 className="mt-1 text-lg font-extrabold">{b.title}</h2>
                {b.subtitle && <p className="mt-1 text-sm text-muted-foreground">{b.subtitle}</p>}
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold">{b.linkText ?? "Детальніше"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </section>
        )}

        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-extrabold">Марки тягачів</h2>
            <Link href="/catalog" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Увесь каталог →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {tractors.map((m) => (
              <Link key={m.id} href={`/brands/${m.slug}`} className="group flex flex-col justify-between rounded-xl border bg-card p-4 transition-colors hover:border-primary/50">
                <Truck className="size-6 text-muted-foreground transition-colors group-hover:text-primary" />
                <span className="mt-6 text-lg leading-tight font-black">{m.name}</span>
                <span className="mt-1 truncate text-xs text-muted-foreground">{m.series.map((s) => s.name).join(" · ")}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-6 rounded-2xl border bg-card p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <Container className="size-8 text-primary" />
            <h2 className="mt-3 text-2xl font-extrabold">Напівпричепи — окремий розділ</h2>
            <p className="mt-2 text-muted-foreground">Осі BPW, SAF, ROR: гальма, ступиці, пневматика. Додайте причіп у гараж із маркою осей — підберемо деталі саме під них.</p>
            <Button asChild className="mt-5"><Link href="/trailers">До розділу причепів</Link></Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["BPW", "SAF", "ROR"].map((a) => (
              <Link key={a} href={`/trailers?axle=${a}`} className="bg-grid flex aspect-square flex-col items-center justify-center rounded-xl border transition-colors hover:border-primary/50">
                <span className="font-num text-2xl font-black sm:text-3xl">{a}</span>
                <span className="mt-1 text-xs text-muted-foreground">осі</span>
              </Link>
            ))}
            <p className="col-span-3 text-sm text-muted-foreground">Марки причепів: {trailers.map((t) => t.name).join(", ")}</p>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="mb-5 text-2xl font-extrabold">Популярні категорії</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {tree.map((c) => (
              <Link key={c.id} href={`/catalog/${c.slug}`} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary"><CategoryIcon icon={c.icon} /></span>
                <span className="min-w-0"><span className="block truncate text-sm font-bold">{c.name}</span><span className="text-xs text-muted-foreground">{c.count} товарів</span></span>
              </Link>
            ))}
          </div>
        </section>

        {kits.length > 0 && (
          <section className="mt-14">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold">Комплекти ТО</h2>
                <p className="text-muted-foreground">Фільтри, олива й ремені під двигун — одним кліком</p>
              </div>
              <Link href="/kits" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Усі комплекти →</Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {kits.slice(0, 3).map((k) => (
                <Link key={k.id} href={`/kits/${k.slug}`} className="rounded-xl border bg-card p-5 transition-colors hover:border-primary/50">
                  <Wrench className="size-6 text-primary" />
                  <h3 className="mt-3 font-extrabold">{k.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{k.items.length} позицій · інтервал {k.intervalKm?.toLocaleString("uk-UA")} км</p>
                  <p className="mt-3 text-lg font-extrabold">{formatPrice(kitTotal(k.items))}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {popular.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-2xl font-extrabold">Часто купують</h2>
            <ProductGrid items={popular} />
          </section>
        )}

        <section className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Car, "Гараж авто й причепів", "Один раз додали VIN — далі каталог фільтрується під машину."],
            [ScanLine, "VIN-підбір з менеджером", `Відповідь до ${settings.vin.slaHours} год зі списком деталей прямо в кабінеті.`],
            [Database, "Пам'ятаємо ваші номери", "Підібрані OE-номери зберігаються за авто і працюють автоматично."],
            [ClipboardCheck, "Історія по кожній машині", "Що, коли і на якому пробігу ставили — для наступного ТО."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Car;
            return (
              <div key={t as string} className="rounded-xl border p-5">
                <I className="size-6 text-primary" />
                <p className="mt-3 font-bold">{t as string}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d as string}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            <h2 className="mb-4 text-2xl font-extrabold">Питання та відповіді</h2>
            <div className="divide-y rounded-xl border bg-card">
              {faq.map((f) => (
                <details key={f.id} className="group p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                    {f.question}
                    <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="grid content-start gap-3 rounded-xl border bg-card p-6">
            <h2 className="text-xl font-extrabold">Зв&apos;язатися</h2>
            <a href={`tel:${settings.general.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 font-num text-2xl font-bold"><Phone className="size-5 text-primary" /> {settings.general.phone}</a>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4" /> {settings.general.schedule}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4" /> {settings.general.address}</p>
            <Button asChild variant="outline" className="mt-2"><Link href="/contacts">Усі контакти</Link></Button>
          </div>
        </section>
      </div>
    </>
  );
}
