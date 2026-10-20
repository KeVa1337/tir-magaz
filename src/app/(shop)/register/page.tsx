import type { Metadata } from "next";
import { Car, History, ScanLine } from "lucide-react";
import { RegisterForm } from "@/components/auth/forms";
import { first, type SP } from "@/lib/search-params";

export const metadata: Metadata = { title: "Реєстрація", robots: { index: false } };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = (await searchParams) as SP;
  return (
    <div className="bg-grid mx-auto grid max-w-5xl items-center gap-8 px-4 py-10 md:grid-cols-2">
      <div className="grid gap-5">
        <h1 className="text-3xl font-extrabold">Кабінет водія і автопарку</h1>
        {[
          [Car, "Гараж", "Додайте тягачі й причепи один раз — каталог показуватиме тільки сумісні деталі."],
          [ScanLine, "VIN-запити", "Менеджер підбирає деталі за номером шасі й відповідає прямо в кабінеті."],
          [History, "Історія по кожному авто", "Що, коли і на якому пробігу купували — для наступного ТО."],
        ].map(([Icon, t, d]) => {
          const I = Icon as typeof Car;
          return (
            <div key={t as string} className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"><I className="size-5" /></span>
              <div><p className="font-bold">{t as string}</p><p className="text-sm text-muted-foreground">{d as string}</p></div>
            </div>
          );
        })}
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-xl sm:p-8">
        <h2 className="mb-5 text-xl font-extrabold">Реєстрація</h2>
        <RegisterForm callbackUrl={first(sp.callbackUrl)} />
      </div>
    </div>
  );
}
