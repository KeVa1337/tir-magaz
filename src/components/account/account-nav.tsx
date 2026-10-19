"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, LayoutGrid, Package, ScanLine, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/account", label: "Огляд", icon: LayoutGrid, exact: true },
  { href: "/account/garage", label: "Гараж", icon: Car },
  { href: "/account/orders", label: "Замовлення", icon: Package },
  { href: "/account/vin-requests", label: "VIN-запити", icon: ScanLine },
  { href: "/account/profile", label: "Профіль", icon: UserCog },
];

export function AccountNav({ badges }: { badges: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0" aria-label="Кабінет">
      {ITEMS.map((it) => {
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
        const badge = badges[it.href];
        return (
          <Link key={it.href} href={it.href} className={cn("flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors", active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
            <it.icon className={cn("size-4.5", active && "text-primary")} />
            {it.label}
            {!!badge && <span className="ml-auto rounded-full bg-primary px-1.5 text-xs font-black text-primary-foreground">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
