import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "./config";

const RANK: Record<Role, number> = { CUSTOMER: 0, MANAGER: 1, ADMIN: 2 };

export type SessionUser = { id: string; role: Role; name?: string | null; email?: string | null };

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role, name: session.user.name, email: session.user.email };
}

export function hasRole(user: SessionUser | null, min: Role): boolean {
  return !!user && RANK[user.role] >= RANK[min];
}

/** Для сторінок: редірект на вхід або на головну, якщо прав недостатньо. */
export async function requireRole(min: Role, callbackUrl?: string, deniedTo = "/?denied=1"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
  if (!hasRole(user, min)) redirect(deniedTo);
  return user;
}

/** Для server actions: кидає помилку замість редіректу. */
export async function assertRole(min: Role): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !hasRole(user, min)) throw new Error("Недостатньо прав");
  return user;
}
