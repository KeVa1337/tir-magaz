"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, FlaskConical, Loader2, X } from "lucide-react";
import { demoLoginAction } from "@/server/actions/auth";
import { cn } from "@/lib/utils";

type Role = "guest" | "client" | "manager" | "admin";

const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: "guest", label: "Гість", hint: "без входу" },
  { id: "client", label: "Клієнт", hint: "гараж, VIN-запити" },
  { id: "manager", label: "Менеджер", hint: "замовлення, підбір" },
  { id: "admin", label: "Адмін", hint: "усе + імпорт" },
];

const TRY: Record<Role, { href: string; text: string }[]> = {
  guest: [
    { href: "/search?q=1929-193", text: "Знайти деталь за OE-номером з дефісом" },
    { href: "/pidbir", text: "Підібрати деталі під модель тягача" },
    { href: "/schemes", text: "Клікнути деталь на схемі гальм" },
    { href: "/vin?vin=XLRTEH439GE512345", text: "Розшифрувати VIN" },
    { href: "/kits", text: "Додати комплект ТО одним кліком" },
  ],
  client: [
    { href: "/account/garage", text: "Відкрити гараж: 2 тягачі й причіп" },
    { href: "/catalog?fit=1", text: "Каталог тільки під «Мого авто»" },
    { href: "/account/vin-requests/501", text: "Відповідь менеджера → «Додати все в кошик»" },
    { href: "/search?q=Супорт%20DAF%20XF%20106", text: "Супорт залежить від номера шасі" },
    { href: "/trailers", text: "Запчастини на причіп за марками осей" },
  ],
  manager: [
    { href: "/admin", text: "Дашборд: замовлення, VIN-черга з таймером" },
    { href: "/admin/vin-requests", text: "Відповісти на VIN-запит і прив'язати OE" },
    { href: "/admin/orders?status=NEW", text: "Підтвердити нове замовлення" },
    { href: "/admin/callbacks", text: "Заявки «Передзвоніть» і «В 1 клік»" },
    { href: "/admin/products", text: "Змінити ціну прямо в таблиці" },
  ],
  admin: [
    { href: "/admin/import", text: "Імпорт прайсу з Excel/CSV" },
    { href: "/admin/settings", text: "Налаштування магазину" },
    { href: "/admin/categories", text: "Категорії перетягуванням" },
    { href: "/admin/audit", text: "Журнал: хто що змінив" },
  ],
};

/** Плаваюча демо-панель: перемикання ролей одним кліком і підказки, що спробувати. */
export function DemoPanel({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [target, setTarget] = React.useState<Role | null>(null);

  React.useEffect(() => {
    try {
      if (!localStorage.getItem("tir-demo-seen")) {
        localStorage.setItem("tir-demo-seen", "1");
        const t = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      /* немає доступу до сховища */
    }
  }, []);

  const switchTo = (r: Role) => {
    setTarget(r);
    start(() => demoLoginAction(r, r === "guest" ? "/" : undefined));
  };

  const inAdmin = pathname.startsWith("/admin");

  return (
    <div className={cn("fixed left-3 z-50 print:hidden", inAdmin ? "bottom-3" : "bottom-20 sm:bottom-4")}>
      {open ? (
        <div className="w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-primary/50 bg-popover text-popover-foreground shadow-2xl">
          <div className="flex items-center justify-between gap-2 bg-primary px-4 py-2.5 text-primary-foreground">
            <span className="flex items-center gap-2 text-sm font-extrabold"><FlaskConical className="size-4" /> Демо-режим</span>
            <button onClick={() => setOpen(false)} className="cursor-pointer rounded p-1 hover:bg-black/10" aria-label="Згорнути"><X className="size-4" /></button>
          </div>
          <div className="grid gap-3 p-3">
            <p className="text-xs text-muted-foreground">Дивіться сайт очима різних людей — без реєстрації і паролів:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLES.map((r) => (
                <button key={r.id} disabled={pending} onClick={() => switchTo(r.id)}
                  className={cn("cursor-pointer rounded-lg border px-2.5 py-2 text-left disabled:opacity-60", role === r.id ? "border-primary bg-primary/15" : "hover:bg-accent")}
                  aria-pressed={role === r.id}>
                  <span className="flex items-center gap-1.5 text-sm font-bold">{pending && target === r.id && <Loader2 className="size-3.5 animate-spin" />}{r.label}</span>
                  <span className="text-[11px] text-muted-foreground">{r.hint}</span>
                </button>
              ))}
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Що спробувати</p>
              <ol className="grid gap-0.5">
                {TRY[role].map((t, i) => (
                  <li key={t.href}>
                    <Link href={t.href} onClick={() => setOpen(false)} className="flex gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                      <span className="font-num text-xs text-primary">{i + 1}</span>{t.text}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-[11px] text-muted-foreground">Дані тестові, оплата не проводиться. Усе можна змінювати.</p>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex cursor-pointer items-center gap-2 rounded-full border border-primary/60 bg-popover px-3.5 py-2.5 text-sm font-bold shadow-xl hover:bg-accent">
          <FlaskConical className="size-4 text-primary" /> Демо: {ROLES.find((r) => r.id === role)?.label}
          <ChevronDown className="size-4 rotate-180 opacity-60" />
        </button>
      )}
    </div>
  );
}
