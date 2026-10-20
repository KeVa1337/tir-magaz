import Link from "next/link";
import { getSettings } from "@/server/services/settings";
import { Logo } from "./header-client";

export async function SiteFooter() {
  const { general } = await getSettings();
  return (
    <footer className="mt-16 border-t bg-sidebar pb-20 text-sidebar-foreground sm:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid content-start gap-3 [&_a]:text-white">
          <Logo className="text-white" />
          <p className="text-sm">{general.tagline}. Підбір за VIN і номером шасі.</p>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <p className="font-bold text-white">Каталог</p>
          <Link href="/catalog" className="hover:text-white">Усі категорії</Link>
          <Link href="/trailers" className="hover:text-white">Напівпричепи (BPW, SAF, ROR)</Link>
          <Link href="/kits" className="hover:text-white">Комплекти ТО</Link>
          <Link href="/vin" className="hover:text-white">Підбір за VIN</Link>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <p className="font-bold text-white">Покупцям</p>
          <Link href="/order-status" className="hover:text-white">Статус замовлення</Link>
          <Link href="/favorites" className="hover:text-white">Обране</Link>
          <Link href="/delivery-payment" className="hover:text-white">Доставка і оплата</Link>
          <Link href="/warranty-returns" className="hover:text-white">Гарантія і повернення</Link>
          <Link href="/about" className="hover:text-white">Про нас</Link>
          <Link href="/contacts" className="hover:text-white">Контакти</Link>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <p className="font-bold text-white">Зв&apos;язок</p>
          <a href={`tel:${general.phone.replace(/\s/g, "")}`} className="font-num text-base font-bold text-white">{general.phone}</a>
          {general.phone2 && <a href={`tel:${general.phone2.replace(/\s/g, "")}`} className="font-num">{general.phone2}</a>}
          <a href={`mailto:${general.email}`} className="hover:text-white">{general.email}</a>
          <p>{general.schedule}</p>
          <p>{general.address}</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs opacity-70">
          © {new Date().getFullYear()} {general.name}. Демо-версія: дані тестові, оплата не проводиться. Назви марок використано лише для позначення сумісності.
        </p>
      </div>
    </footer>
  );
}
