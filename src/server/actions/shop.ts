"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import * as cart from "@/server/services/cart";
import { VEHICLE_CTX_COOKIE } from "@/server/services/fitment";
import { placeOrder } from "@/server/services/orders";
import { createCallback, quickOrder } from "@/server/services/callbacks";
import { autocomplete } from "@/server/services/search";
import { getVehicleContext } from "@/server/services/fitment";
import { VinService } from "@/server/vin/service";
import { checkoutSchema, fieldErrorsOf, formToObject, type ActionState } from "@/lib/validators";

async function uid() {
  return (await getSessionUser())?.id ?? null;
}

export async function addToCartAction(productId: string, qty = 1, vehicleId?: string | null, offerId?: string | null) {
  try {
    const userId = await uid();
    let vid = vehicleId;
    if (vid === undefined) {
      // за замовчуванням прив'язуємо позицію до поточного «Мого авто»
      const raw = (await cookies()).get(VEHICLE_CTX_COOKIE)?.value;
      vid = raw?.startsWith("v:") ? raw.slice(2) : null;
    }
    await cart.addToCart(userId, productId, qty, vid, offerId);
    revalidatePath("/", "layout");
    return { ok: true, count: await cart.getCartCount(userId) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateCartQtyAction(itemId: string, qty: number) {
  await cart.updateCartQty(await uid(), itemId, qty);
  revalidatePath("/", "layout");
}

export async function removeCartItemAction(itemId: string) {
  await cart.removeCartItem(await uid(), itemId);
  revalidatePath("/", "layout");
}

export async function clearCartAction() {
  await cart.clearCart(await uid());
  revalidatePath("/", "layout");
}

export async function addKitToCartAction(kitId: string) {
  const kit = await db.serviceKit.findUnique({ where: { id: kitId }, include: { items: true } });
  if (!kit) return { ok: false, error: "Комплект не знайдено" };
  const userId = await uid();
  await cart.addManyToCart(userId, kit.items.map((i) => ({ productId: i.productId, qty: i.qty })));
  revalidatePath("/", "layout");
  return { ok: true, count: await cart.getCartCount(userId) };
}

/** Встановити контекст «Моє авто»: v:<vehicleId> з гаража або q:<make>:<series>:<engine>:<year>. */
export async function setVehicleContextAction(value: string | null) {
  const jar = await cookies();
  if (!value) jar.delete(VEHICLE_CTX_COOKIE);
  else if (/^(v|q):[\w:-]*$/.test(value)) jar.set(VEHICLE_CTX_COOKIE, value, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 180 });
  revalidatePath("/", "layout");
}

export async function decodeVinAction(vin: string) {
  return VinService.decode(vin);
}

export async function suggestAction(q: string) {
  if (q.trim().length < 2) return null;
  const user = await getSessionUser();
  return autocomplete(q, await getVehicleContext(user?.id));
}

export async function checkoutAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = checkoutSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), error: "Перевірте поля форми" };
  let number: number;
  try {
    const order = await placeOrder(await uid(), parsed.data);
    number = order.number;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/", "layout");
  redirect(`/checkout/success?n=${number}`);
}

const phoneOk = (p: string) => p.replace(/\D/g, "").length >= 10;

export async function callbackAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const phone = String(fd.get("phone") ?? "").trim();
  if (!phoneOk(phone)) return { fieldErrors: { phone: ["Вкажіть номер телефону"] } };
  await createCallback({ phone, name: String(fd.get("name") ?? "").trim(), comment: String(fd.get("comment") ?? "").trim(), productId: String(fd.get("productId") ?? "") || undefined });
  return { ok: true, message: "Дякуємо! Менеджер передзвонить найближчим часом." };
}

export async function quickOrderAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const phone = String(fd.get("phone") ?? "").trim();
  if (!phoneOk(phone)) return { fieldErrors: { phone: ["Вкажіть номер телефону"] } };
  try {
    const order = await quickOrder({
      productId: String(fd.get("productId") ?? ""), qty: Number(fd.get("qty") ?? 1) || 1,
      name: String(fd.get("name") ?? "").trim(), phone, userId: await uid(),
    });
    revalidatePath("/admin", "layout");
    return { ok: true, message: `Замовлення №${order.number} прийнято. Менеджер передзвонить, щоб уточнити доставку.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
