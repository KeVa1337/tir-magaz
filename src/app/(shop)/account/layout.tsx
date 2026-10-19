import type { Metadata } from "next";
import { requireRole } from "@/server/auth/guards";
import { db } from "@/server/db";
import { AccountNav } from "@/components/account/account-nav";

export const metadata: Metadata = { title: { default: "Кабінет", template: "%s · Кабінет · TIR Parts" }, robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("CUSTOMER", "/account");
  const answered = await db.vinRequest.count({ where: { userId: user.id, status: "ANSWERED" } });
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-36 lg:self-start">
        <p className="mb-3 hidden truncate px-3 text-xs font-semibold text-muted-foreground uppercase lg:block">{user.name ?? user.email}</p>
        <AccountNav badges={{ "/account/vin-requests": answered }} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
