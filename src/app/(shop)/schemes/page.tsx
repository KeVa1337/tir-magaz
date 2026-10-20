import Link from "next/link";
import type { Metadata } from "next";
import { SCHEMES } from "@/lib/schemes";
import { SchemeArt } from "@/components/shop/scheme-art";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";
import { getShopContext } from "@/server/context";

export const metadata: Metadata = { title: "Схеми вузлів", description: "Оберіть деталь на схемі вузла вантажівки — покажемо сумісні запчастини." };

export default async function SchemesPage() {
  const { ctx } = await getShopContext();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Головна", href: "/" }, { label: "Схеми вузлів" }]} />
      <PageHeader title="Схеми вузлів" description={ctx ? `Деталі підбираються для: ${ctx.label}` : "Не знаєте, як називається деталь? Покажіть її на схемі."} />
      <div className="grid gap-4 md:grid-cols-3">
        {SCHEMES.map((s) => (
          <Link key={s.slug} href={`/schemes/${s.slug}`} className="group overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/50">
            <div className="bg-grid border-b p-4"><SchemeArt slug={s.slug} className="h-auto w-full text-muted-foreground transition-colors group-hover:text-foreground" /></div>
            <div className="p-4"><h2 className="font-extrabold">{s.title}</h2><p className="mt-1 text-sm text-muted-foreground">{s.description}</p></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
