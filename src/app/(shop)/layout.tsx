import { SiteHeader } from "@/components/shop/site-header";
import { SiteFooter } from "@/components/shop/site-footer";
import { ContactFab } from "@/components/shop/contact-fab";
import { getSettings } from "@/server/services/settings";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const { general } = await getSettings();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ContactFab phone={general.phone} telegram={general.telegram} />
    </div>
  );
}
