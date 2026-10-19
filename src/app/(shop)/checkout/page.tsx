import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getShopContext } from "@/server/context";
import { getCartView } from "@/server/services/cart";
import { getSettings } from "@/server/services/settings";
import { getProfile } from "@/server/services/users";
import { listGarageOptions } from "@/server/services/fitment";
import { db } from "@/server/db";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { Breadcrumbs } from "@/components/shared/misc";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Оформлення замовлення", robots: { index: false } };

export default async function CheckoutPage() {
  const { user, ctx } = await getShopContext();
  const cart = await getCartView(user?.id ?? null);
  if (!cart.items.length) redirect("/cart");
  const settings = await getSettings();
  const profile = user ? await getProfile(user.id) : null;
  const garage = user ? await listGarageOptions(user.id) : [];
  const mileage = user ? await db.vehicle.findMany({ where: { userId: user.id }, select: { id: true, mileageKm: true } }) : [];
  const addr = profile?.addresses.find((a) => a.isDefault) ?? profile?.addresses[0];
  const itemVehicle = cart.items.find((i) => i.vehicle)?.vehicle?.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Кошик", href: "/cart" }, { label: "Оформлення" }]} />
      <h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">Оформлення замовлення</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <CheckoutForm
          total={cart.total}
          defaults={{ name: profile?.name ?? undefined, phone: profile?.phone ?? undefined, email: profile?.email ?? undefined, city: addr?.city, branch: addr?.branch ?? undefined, vehicleId: itemVehicle ?? ctx?.vehicleId }}
          vehicles={garage.map((g) => ({ ...g, mileageKm: mileage.find((m) => m.id === g.id)?.mileageKm ?? null }))}
          allowedDelivery={settings.commerce.deliveryMethods}
          allowedPayment={settings.commerce.paymentMethods}
          pickupAddress={settings.general.address}
        />
        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-xl border bg-card">
            <p className="border-b p-4 font-bold">Ваше замовлення</p>
            <ul className="max-h-96 divide-y overflow-y-auto">
              {cart.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 p-4 text-sm">
                  <span className="min-w-0"><span className="line-clamp-2">{i.product.name}</span><span className="font-num text-xs text-muted-foreground">{i.product.article} × {i.qty}</span></span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatPrice(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t p-4 font-extrabold"><span>Разом</span><span className="tabular-nums">{formatPrice(cart.total)}</span></div>
          </div>
          <Link href="/cart" className="mt-3 block text-center text-sm text-muted-foreground underline">Змінити кошик</Link>
        </aside>
      </div>
    </div>
  );
}
