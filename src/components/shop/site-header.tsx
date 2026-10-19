import Link from "next/link";
import { Phone } from "lucide-react";
import { getSessionUser } from "@/server/auth/guards";
import { getCartCount } from "@/server/services/cart";
import { getVehicleContext, listGarageOptions } from "@/server/services/fitment";
import { getVehicleDirectory } from "@/server/services/catalog";
import { getSettings } from "@/server/services/settings";
import { ThemeToggle } from "@/components/shared/theme";
import { SearchBox } from "./search-box";
import { VehicleSwitcher } from "./vehicle-switcher";
import { CartButton, DesktopNav, Logo, MobileBottomNav, MobileMenu, UserMenu } from "./header-client";

export async function SiteHeader() {
  const user = await getSessionUser();
  const [count, ctx, garage, directory, settings] = await Promise.all([
    getCartCount(user?.id ?? null),
    getVehicleContext(user?.id),
    user ? listGarageOptions(user.id) : Promise.resolve([]),
    getVehicleDirectory(),
    getSettings(),
  ]);
  return (
    <>
      <div className="border-b bg-sidebar text-sidebar-foreground max-sm:hidden">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-4 px-4 text-xs">
          <span className="truncate">{settings.general.schedule} · Відправка Новою Поштою в день замовлення</span>
          <div className="flex items-center gap-4">
            <Link href="/delivery-payment" className="hover:text-white">Доставка і оплата</Link>
            <Link href="/contacts" className="hover:text-white">Контакти</Link>
            <a href={`tel:${settings.general.phone.replace(/\s/g, "")}`} className="flex items-center gap-1 font-num font-semibold text-white">
              <Phone className="size-3" /> {settings.general.phone}
            </a>
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <MobileMenu user={user} phone={settings.general.phone} />
          <Logo />
          <DesktopNav />
          <SearchBox className="ml-auto max-w-xl max-md:hidden" />
          <div className="ml-auto flex items-center gap-0.5 md:ml-0">
            <ThemeToggle className="max-sm:hidden" />
            <UserMenu user={user} />
            <CartButton count={count} />
          </div>
        </div>
        <div className="border-t bg-card/60">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2">
            <VehicleSwitcher
              current={ctx ? { label: ctx.label, source: ctx.source, vehicleId: ctx.vehicleId } : null}
              garage={garage}
              directory={directory}
              loggedIn={!!user}
            />
            {ctx && (
              <Link href="/catalog?fit=1" className="shrink-0 text-sm font-semibold text-primary hover:underline max-sm:hidden">
                Деталі для цього авто →
              </Link>
            )}
          </div>
          <div className="px-4 pb-2 md:hidden">
            <SearchBox />
          </div>
        </div>
      </header>
      <MobileBottomNav count={count} loggedIn={!!user} />
    </>
  );
}
