import Link from "next/link";
import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { getShopContext } from "@/server/context";
import { getCartView } from "@/server/services/cart";
import { getSettings } from "@/server/services/settings";
import { CartItems } from "@/components/shop/cart-items";
import { EmptyState, PageHeader } from "@/components/shared/misc";
import { Button } from "@/components/ui/button";
import { formatPrice, pluralUa } from "@/lib/format";

export const metadata: Metadata = { title: "Кошик", robots: { index: false } };

export default async function CartPage() {
  const { user } = await getShopContext();
  const [cart, settings] = await Promise.all([getCartView(user?.id ?? null), getSettings()]);
  const freeLeft = settings.commerce.freeShippingFrom - cart.total;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader title="Кошик" description={cart.count ? `${cart.count} ${pluralUa(cart.count, ["товар", "товари", "товарів"])}` : undefined} />
      {!cart.items.length ? (
        <EmptyState icon={ShoppingCart} title="Кошик порожній" text="Знайдіть деталь за номером, VIN або оберіть комплект ТО під свій двигун.">
          <Button asChild><Link href="/catalog">До каталогу</Link></Button>
          <Button asChild variant="outline"><Link href="/kits">Комплекти ТО</Link></Button>
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <CartItems items={cart.items} />
          <aside className="lg:sticky lg:top-36 lg:self-start">
            <div className="grid gap-4 rounded-xl border bg-card p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Разом</span>
                <span className="text-2xl font-extrabold tabular-nums">{formatPrice(cart.total)}</span>
              </div>
              {freeLeft > 0 ? (
                <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Ще {formatPrice(freeLeft)} — і доставка Новою Поштою безкоштовна</p>
              ) : (
                <p className="rounded-lg bg-success/10 px-3 py-2 text-xs font-semibold text-success">Безкоштовна доставка Новою Поштою</p>
              )}
              <Button asChild size="lg"><Link href="/checkout">Оформити замовлення</Link></Button>
              {!user && <p className="text-center text-xs text-muted-foreground">Можна оформити без реєстрації. <Link href="/login?callbackUrl=/checkout" className="font-semibold text-foreground underline">Увійти</Link> — щоб прив&apos;язати до авто.</p>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
