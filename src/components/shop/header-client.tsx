"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Car, Network, LayoutDashboard, LogIn, LogOut, Menu, Package, ScanLine, Search, ShoppingCart, User, Wrench, Container } from "lucide-react";
import { Dialog, DialogTrigger, SheetContent, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme";
import { logoutAction } from "@/server/actions/auth";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/catalog", label: "Каталог", icon: Boxes },
  { href: "/pidbir", label: "Підбір за авто", icon: Car },
  { href: "/schemes", label: "Схеми вузлів", icon: Network },
  { href: "/trailers", label: "Причепи", icon: Container },
  { href: "/kits", label: "Комплекти ТО", icon: Wrench },
  { href: "/vin", label: "VIN", icon: ScanLine },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex shrink-0 items-center gap-2", className)} aria-label="TIR Parts — на головну">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <span className="font-num text-[13px] font-black">TP</span>
        <span className="absolute -right-1 -bottom-1 size-2.5 rounded-sm bg-foreground" />
      </span>
      <span className="text-lg leading-none font-black tracking-tight">
        TIR<span className="text-primary">·</span>Parts
      </span>
    </Link>
  );
}

export function CartButton({ count }: { count: number }) {
  return (
    <Button asChild variant="ghost" size="icon" className="relative" aria-label={`Кошик, товарів: ${count}`}>
      <Link href="/cart">
        <ShoppingCart className="size-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-black text-primary-foreground tabular-nums">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}

export function UserMenu({ user }: { user: { name?: string | null; email?: string | null; role: string } | null }) {
  if (!user)
    return (
      <Button asChild variant="ghost" size="sm" className="h-10 max-sm:hidden">
        <Link href="/login"><LogIn /> Увійти</Link>
      </Button>
    );
  const staff = user.role !== "CUSTOMER";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Кабінет" className="max-sm:hidden">
          <User className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="normal-case">
          <span className="block truncate text-sm text-foreground">{user.name ?? "Мій кабінет"}</span>
          <span className="block truncate font-normal">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {staff && <DropdownMenuItem asChild><Link href="/admin"><LayoutDashboard /> Адмін-панель</Link></DropdownMenuItem>}
        <DropdownMenuItem asChild><Link href="/account"><User /> Кабінет</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/garage"><Car /> Гараж</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/orders"><Package /> Замовлення</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/vin-requests"><ScanLine /> VIN-запити</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logoutAction()}><LogOut /> Вийти</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MobileMenu({ user, phone }: { user: { name?: string | null; role: string } | null; phone: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Меню">
          <Menu className="size-5" />
        </Button>
      </DialogTrigger>
      <SheetContent title="Меню" side="left">
        <nav className="grid gap-1">
          {NAV.map((n) => (
            <DialogClose asChild key={n.href}>
              <Link href={n.href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold hover:bg-accent">
                <n.icon className="size-5 text-muted-foreground" /> {n.label}
              </Link>
            </DialogClose>
          ))}
        </nav>
        <div className="grid gap-1 border-t pt-3">
          {[["/delivery-payment", "Доставка і оплата"], ["/warranty-returns", "Гарантія і повернення"], ["/about", "Про нас"], ["/contacts", "Контакти"]].map(([href, label]) => (
            <DialogClose asChild key={href}>
              <Link href={href} className="rounded-lg px-3 py-2.5 text-sm hover:bg-accent">{label}</Link>
            </DialogClose>
          ))}
        </div>
        <div className="mt-auto grid gap-2 border-t pt-4">
          {user ? (
            <>
              {user.role !== "CUSTOMER" && <Button asChild variant="secondary"><Link href="/admin">Адмін-панель</Link></Button>}
              <Button variant="outline" onClick={() => logoutAction()}><LogOut /> Вийти</Button>
            </>
          ) : (
            <Button asChild><Link href="/login">Увійти / Реєстрація</Link></Button>
          )}
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-center font-num text-sm font-semibold">{phone}</a>
          <div className="flex justify-center"><ThemeToggle /></div>
        </div>
      </SheetContent>
    </Dialog>
  );
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-0.5 max-xl:hidden">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className={cn("rounded-md px-2.5 py-2 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground", pathname.startsWith(n.href) && "text-foreground")}>
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

/** Нижня навігація на телефоні — великі зони натискання для водія. */
export function MobileBottomNav({ count, loggedIn }: { count: number; loggedIn: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/catalog", label: "Каталог", icon: Boxes },
    { href: "/search", label: "Пошук", icon: Search },
    { href: "/vin", label: "VIN", icon: ScanLine },
    { href: "/cart", label: "Кошик", icon: ShoppingCart, badge: count },
    { href: loggedIn ? "/account" : "/login", label: loggedIn ? "Кабінет" : "Увійти", icon: User },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden" aria-label="Швидка навігація">
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
          return (
            <Link key={it.href} href={it.href} className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", active ? "text-primary" : "text-muted-foreground")}>
              <it.icon className="size-5.5" />
              {it.label}
              {!!it.badge && <span className="absolute top-2 left-1/2 ml-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground">{it.badge}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
