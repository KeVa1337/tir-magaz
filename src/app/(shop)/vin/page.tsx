import type { Metadata } from "next";
import { Clock, Database, ShieldCheck } from "lucide-react";
import { getShopContext } from "@/server/context";
import { listGarageOptions } from "@/server/services/fitment";
import { getSettings } from "@/server/services/settings";
import { db } from "@/server/db";
import { VinDecoder } from "@/components/shop/vin-decoder";
import { VinRequestForm } from "@/components/shop/vin-request-form";
import { Breadcrumbs } from "@/components/shared/misc";
import { first, type SP } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Підбір запчастин за VIN",
  description: "Розшифровка VIN вантажівки чи напівпричепа і підбір запчастин менеджером з урахуванням номера шасі.",
};

export default async function VinPage({ searchParams }: PageProps<"/vin">) {
  const sp = (await searchParams) as SP;
  const vin = first(sp.vin);
  const productSlug = first(sp.product);
  const { user } = await getShopContext();
  const [vehicles, settings, product] = await Promise.all([
    user ? listGarageOptions(user.id) : Promise.resolve([]),
    getSettings(),
    productSlug ? db.product.findUnique({ where: { slug: productSlug }, select: { name: true, article: true, brand: { select: { name: true } } } }) : null,
  ]);
  const defaultMessage = product ? `Чи підходить ${product.name} (${product.brand.name} ${product.article})?` : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Головна", href: "/" }, { label: "Підбір за VIN" }]} />
      <h1 className="text-3xl font-extrabold sm:text-4xl">Підбір за VIN</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Розшифруємо VIN і визначимо марку, рік та номер шасі. Для точного підбору менеджер перевірить деталі в оригінальних каталогах і відповість у кабінеті.
      </p>

      <div className="mt-6"><VinDecoder initialVin={vin} loggedIn={!!user} /></div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section id="vin-request" className="scroll-mt-40 rounded-2xl border bg-card p-5 sm:p-7">
          <h2 className="text-xl font-extrabold">Запит менеджеру</h2>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">Опишіть, що потрібно — відповімо списком деталей, які можна одним кліком додати в кошик.</p>
          <VinRequestForm loggedIn={!!user} vehicles={vehicles} defaultVin={vin} defaultMessage={defaultMessage} />
        </section>
        <aside className="grid content-start gap-4">
          {[
            [Clock, `Відповідь до ${settings.vin.slaHours} год`, "У робочий час. Запити приймаємо цілодобово."],
            [ShieldCheck, "З урахуванням номера шасі", "У вантажівок деталі змінюються в межах однієї моделі — перевіряємо по шасі."],
            [Database, "Запам'ятовуємо для вашого авто", "Підібрані OE-номери зберігаються в гаражі й далі працюють автоматично."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Clock;
            return (
              <div key={t as string} className="flex gap-3 rounded-xl border p-4">
                <I className="size-5 shrink-0 text-primary" />
                <div><p className="text-sm font-bold">{t as string}</p><p className="text-sm text-muted-foreground">{d as string}</p></div>
              </div>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
