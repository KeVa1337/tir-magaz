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

/** Вхід за телефоном — заглушка до підключення SMS-провайдера (🟡). */
export async function phoneOtpAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const phone = String(fd.get("phone") ?? "").trim();
  if (phone.replace(/\D/g, "").length < 10) return { fieldErrors: { phone: ["Вкажіть номер телефону"] } };
  return { message: `Демо: SMS із кодом на ${phone} не надсилається — вхід за телефоном з'явиться після підключення SMS-провайдера.` };
}

export async function logoutAction() {
  const jar = await cookies();
  if (jar.get(VEHICLE_CTX_COOKIE)?.value.startsWith("v:")) jar.delete(VEHICLE_CTX_COOKIE);
  await signOut({ redirectTo: "/" });
}
