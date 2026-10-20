"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList, PhoneCall, FileSpreadsheet, FolderTree, Gauge, History, LayoutTemplate, Menu, Package, ScanLine, Search, Settings, Store, Tags, UserCog, Users, Wrench,
} from "lucide-react";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

const GROUPS = [
  { title: "Продажі", items: [
    { href: "/admin", label: "Дашборд", icon: Gauge, exact: true },
    { href: "/admin/orders", label: "Замовлення", icon: ClipboardList, badge: "orders" },
    { href: "/admin/vin-requests", label: "VIN-запити", icon: ScanLine, badge: "vin" },
    { href: "/admin/callbacks", label: "Дзвінки, 1 клік", icon: PhoneCall, badge: "calls" },
    { href: "/admin/customers", label: "Клієнти", icon: Users },
  ] },
  { title: "Каталог", items: [
    { href: "/admin/products", label: "Товари", icon: Package },
    { href: "/admin/categories", label: "Категорії", icon: FolderTree },
    { href: "/admin/brands", label: "Бренди і марки", icon: Tags },
    { href: "/admin/kits", label: "Комплекти ТО", icon: Wrench },
    { href: "/admin/import", label: "Імпорт", icon: FileSpreadsheet, admin: true },
  ] },
  { title: "Система", items: [
    { href: "/admin/content", label: "Контент", icon: LayoutTemplate },
    { href: "/admin/settings", label: "Налаштування", icon: Settings, admin: true },
    { href: "/admin/users", label: "Співробітники", icon: UserCog, admin: true },
    { href: "/admin/audit", label: "Журнал дій", icon: History },
  ] },
];

function NavList({ isAdmin, badges, onNavigate }: { isAdmin: boolean; badges: Record<string, number>; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-5">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">{g.title}</p>
          <ul className="grid gap-0.5">
            {g.items.filter((i) => !("admin" in i && i.admin) || isAdmin).map((i) => {
              const active = "exact" in i && i.exact ? pathname === i.href : pathname.startsWith(i.href);
              const badge = "badge" in i && i.badge ? badges[i.badge] : 0;
              return (
                <li key={i.href}>
                  <Link href={i.href} onClick={onNavigate} className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors", active ? "bg-white/10 text-white" : "text-sidebar-foreground hover:bg-white/5 hover:text-white")}>
                    <i.icon className={cn("size-4", active && "text-primary")} />
                    {i.label}
                    {!!badge && <span className="ml-auto rounded bg-primary px-1.5 text-[11px] font-black text-primary-foreground tabular-nums">{badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ isAdmin, badges }: { isAdmin: boolean; badges: Record<string, number> }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 overflow-y-auto bg-sidebar px-3 py-5 text-sidebar-foreground lg:flex">
      <Link href="/admin" className="flex items-center gap-2 px-3">
        <span className="flex size-7 items-center justify-center rounded bg-primary font-num text-xs font-black text-primary-foreground">TP</span>
        <span className="font-black text-white">TIR·Parts <span className="font-medium text-sidebar-foreground/60">admin</span></span>
      </Link>
      <NavList isAdmin={isAdmin} badges={badges} />
      <Link href="/" className="mt-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/5 hover:text-white"><Store className="size-4" /> Відкрити магазин</Link>
    </aside>
  );
}

export function AdminMobileNav({ isAdmin, badges }: { isAdmin: boolean; badges: Record<string, number> }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Меню"><Menu /></Button></DialogTrigger>
      <SheetContent title="Адмін-панель" className="bg-sidebar text-sidebar-foreground">
        <NavList isAdmin={isAdmin} badges={badges} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Dialog>
  );
}

/** Пошук по адмінці; гаряча клавіша «/». */
export function AdminSearch() {
  const router = useRouter();
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <form className="relative w-full max-w-md" role="search" onSubmit={(e) => { e.preventDefault(); const q = ref.current?.value.trim(); if (q) router.push(`/admin/search?q=${encodeURIComponent(q)}`); }}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input ref={ref} aria-label="Пошук в адмінці" placeholder="Замовлення №, артикул, телефон, VIN…" className="h-9 w-full rounded-md border bg-card pr-10 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40" />
      <Kbd className="absolute top-1/2 right-2 -translate-y-1/2">/</Kbd>
    </form>
  );
}

