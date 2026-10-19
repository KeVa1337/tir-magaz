import Link from "next/link";
import type { Metadata } from "next";
import { ScanLine, SearchX } from "lucide-react";
import { search, type SearchHit } from "@/server/services/search";
import { getShopContext } from "@/server/context";
import { EmptyState, PageHeader } from "@/components/shared/misc";
import { ProductCard } from "@/components/shop/product-card";
import { SearchBox } from "@/components/shop/search-box";
import { Button } from "@/components/ui/button";
import { first, type SP } from "@/lib/search-params";
import { pluralUa } from "@/lib/format";

export const metadata: Metadata = { title: "Пошук запчастин", robots: { index: false } };

const GROUPS: { key: SearchHit["match"][]; title: string; hint?: string }[] = [
  { key: ["article"], title: "Точний збіг за артикулом" },
  { key: ["oe"], title: "Аналоги за OE / крос-номером", hint: "Деталі інших виробників, що замінюють шуканий номер" },
  { key: ["prefix"], title: "Схожі номери" },
  { key: ["text"], title: "За назвою" },
];

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = (await searchParams) as SP;
  const q = first(sp.q)?.trim() ?? "";
  const { ctx } = await getShopContext();
  const res = q ? await search(q, ctx) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader title={q ? <>Пошук: <span className="font-num">{q}</span></> : "Пошук запчастин"} description={res ? `${res.hits.length} ${pluralUa(res.hits.length, ["результат", "результати", "результатів"])}` : "Артикул, OE-номер, крос-номер, VIN або назва деталі"} />
      <SearchBox defaultValue={q} className="mb-6 max-w-2xl" autoFocus={!q} />

      {res?.vinCandidate && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4">
          <p className="flex items-center gap-2"><ScanLine className="size-5 text-primary" /> Запит схожий на VIN <span className="font-num font-bold">{res.norm}</span></p>
          <Button asChild><Link href={`/vin?vin=${res.norm}`}>Розшифрувати VIN</Link></Button>
        </div>
      )}

      {res && res.categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {res.categories.map((c) => <Link key={c.slug} href={`/catalog/${c.slug}`} className="rounded-full border bg-card px-4 py-2 text-sm font-semibold hover:border-primary/50">{c.name} →</Link>)}
        </div>
      )}

      {res && !res.hits.length && !res.vinCandidate && (
        <EmptyState icon={SearchX} title="Нічого не знайдено" text="Перевірте номер або надішліть VIN-запит — менеджер підбере деталь вручну.">
          <Button asChild><Link href="/vin">Запит менеджеру</Link></Button>
          <Button asChild variant="outline"><Link href="/catalog">До каталогу</Link></Button>
        </EmptyState>
      )}

      {res &&
        GROUPS.map((g) => {
          const hits = res.hits.filter((h) => g.key.includes(h.match));
          if (!hits.length) return null;
          return (
            <section key={g.title} className="mb-10">
              <h2 className="text-lg font-extrabold">{g.title} <span className="text-muted-foreground">({hits.length})</span></h2>
              {g.hint && <p className="text-sm text-muted-foreground">{g.hint}</p>}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {hits.map((h) => (
                  <ProductCard key={h.id} p={h} note={h.match === "oe" && h.matchedNumber ? <p className="text-xs font-semibold text-info">Аналог для {h.matchedBrand ?? "OE"} <span className="font-num">{h.matchedNumber}</span></p> : undefined} />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}
