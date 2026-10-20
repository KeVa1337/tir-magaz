"use server";

import { cookies } from "next/headers";
import { signIn, signOut, verifyCredentials } from "@/server/auth/config";
import { mergeGuestCart } from "@/server/services/cart";
import { registerUser } from "@/server/services/users";
import { VEHICLE_CTX_COOKIE } from "@/server/services/fitment";
import { fieldErrorsOf, formToObject, loginSchema, registerSchema, type ActionState } from "@/lib/validators";

function safeCallback(url: string | undefined, fallback: string) {
  return url && url.startsWith("/") && !url.startsWith("//") ? url : fallback;
}

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const raw = formToObject(fd);
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) return { error: "Невірний email або пароль" };
  await mergeGuestCart(user.id);
  const fallback = user.role === "CUSTOMER" ? "/account" : "/admin";
  await signIn("credentials", { ...parsed.data, redirectTo: safeCallback(raw.callbackUrl, fallback) });
  return { ok: true };
}

export async function registerAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const raw = formToObject(fd);
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  try {
    const user = await registerUser({ ...parsed.data, phone: parsed.data.phone || undefined });
    await mergeGuestCart(user.id);
  } catch (e) {
    return { error: (e as Error).message };
  }
  await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirectTo: safeCallback(raw.callbackUrl, "/account/garage/new?welcome=1") });
  return { ok: true };
}

export async function logoutAction() {
  const jar = await cookies();
  if (jar.get(VEHICLE_CTX_COOKIE)?.value.startsWith("v:")) jar.delete(VEHICLE_CTX_COOKIE);
  await signOut({ redirectTo: "/" });
}

const DEMO_ACCOUNTS = { client: "client@demo.ua", manager: "manager@demo.ua", admin: "admin@demo.ua" } as const;

/** Демо-режим: вхід у тестову роль одним кліком (без введення пароля). */
export async function demoLoginAction(role: keyof typeof DEMO_ACCOUNTS | "guest", redirectTo?: string) {
  if (process.env.DEMO_MODE !== "true") throw new Error("Демо-вхід вимкнено");
  const target = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : undefined;
  if (role === "guest") {
    await signOut({ redirectTo: target ?? "/" });
    return;
  }
  const email = DEMO_ACCOUNTS[role];
  const user = await verifyCredentials(email, "demo1234");
  if (!user) throw new Error("Демо-користувача не знайдено — запустіть seed");
  await mergeGuestCart(user.id);
  await signIn("credentials", { email, password: "demo1234", redirectTo: target ?? (role === "client" ? "/account" : "/admin") });
}
