import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { getShopContext } from "@/server/context";
import { getSettings } from "@/server/services/settings";
import { Button } from "@/components/ui/button";
import { first, type SP } from "@/lib/search-params";

export const metadata: Metadata = { title: "Замовлення оформлено", robots: { index: false } };

export default async function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const sp = (await searchParams) as SP;
  const n = first(sp.n);
  const { user } = await getShopContext();
  const { general } = await getSettings();
  return (
    <div className="mx-auto grid max-w-xl place-items-center px-4 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success"><CheckCircle2 className="size-9" /></span>
      <h1 className="mt-5 text-3xl font-extrabold">Дякуємо! Замовлення прийнято</h1>
      {n && <p className="mt-2 text-lg">Номер замовлення: <b className="font-num">№{n}</b></p>}
      <p className="mt-3 text-muted-foreground">Менеджер перевірить наявність і зателефонує для підтвердження. Статус: «очікує підтвердження». Телефон: <a className="font-num font-semibold text-foreground" href={`tel:${general.phone.replace(/\s/g, "")}`}>{general.phone}</a></p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {user && n ? <Button asChild><Link href={`/account/orders/${n}`}>Переглянути замовлення</Link></Button> : <Button asChild><Link href="/register">Створити кабінет</Link></Button>}
        <Button asChild variant="outline"><Link href="/catalog">Продовжити покупки</Link></Button>
      </div>
    </div>
  );
}
