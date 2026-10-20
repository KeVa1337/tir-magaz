import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { db } from "@/server/db";
import { logoutAction } from "@/server/actions/auth";
import { AdminMobileNav, AdminSearch, AdminSidebar } from "@/components/admin/sidebar";
import { ThemeToggle } from "@/components/shared/theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/labels";

export const metadata: Metadata = { title: { default: "Адмін-панель", template: "%s · Адмінка TIR Parts" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("MANAGER", "/admin");
  const [orders, vin] = await Promise.all([
    db.order.count({ where: { status: "NEW" } }),
    db.vinRequest.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } }),
  ]);
  const badges = { orders, vin };
  const isAdmin = user.role === "ADMIN";
  return (
    <div className="flex min-h-dvh">
      <AdminSidebar isAdmin={isAdmin} badges={badges} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
          <AdminMobileNav isAdmin={isAdmin} badges={badges} />
          <AdminSearch />
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-2 hidden text-sm sm:inline">{user.name} <Badge tone={isAdmin ? "primary" : "blue"} className="ml-1">{ROLE_LABEL[user.role]}</Badge></span>
            <ThemeToggle />
            <form action={logoutAction}><Button variant="ghost" size="icon" aria-label="Вийти"><LogOut className="size-4.5" /></Button></form>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
        <footer className="border-t px-6 py-3 text-xs text-muted-foreground">TIR Parts · демо-адмінка · <Link href="/" className="underline">магазин</Link></footer>
      </div>
    </div>
  );
}
