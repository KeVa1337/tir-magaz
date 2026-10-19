"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import * as garage from "@/server/services/garage";
import * as vin from "@/server/services/vinRequests";
import * as users from "@/server/services/users";
import { addManyToCart, getCartCount } from "@/server/services/cart";
import { VEHICLE_CTX_COOKIE } from "@/server/services/fitment";
import { saveUploads } from "@/server/services/uploads";
import {
  addressSchema, fieldErrorsOf, formToObject, passwordSchema, profileSchema, vehicleSchema, vinRequestSchema, type ActionState,
} from "@/lib/validators";

async function requireUid() {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  return u.id;
}

export async function saveVehicleAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const userId = await requireUid();
  const parsed = vehicleSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), error: "Перевірте поля форми" };
  const id = String(fd.get("id") ?? "");
  let vehicleId: string;
  try {
    if (id) vehicleId = (await garage.updateVehicle(userId, id, parsed.data)).id;
    else vehicleId = (await garage.createVehicle(userId, parsed.data)).id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  // нове авто одразу стає контекстом підбору
  if (!id) (await cookies()).set(VEHICLE_CTX_COOKIE, `v:${vehicleId}`, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 180 });
  revalidatePath("/", "layout");
  redirect(`/account/garage/${vehicleId}${id ? "" : "?created=1"}`);
}

export async function deleteVehicleAction(id: string) {
  const userId = await requireUid();
  await garage.deleteVehicle(userId, id);
  const jar = await cookies();
  if (jar.get(VEHICLE_CTX_COOKIE)?.value === `v:${id}`) jar.delete(VEHICLE_CTX_COOKIE);
  revalidatePath("/", "layout");
  redirect("/account/garage");
}

export async function updateMileageAction(id: string, mileageKm: number) {
  const userId = await requireUid();
  if (!Number.isFinite(mileageKm) || mileageKm < 0) return;
  await garage.updateMileage(userId, id, Math.round(mileageKm));
  revalidatePath(`/account/garage/${id}`);
}

/** VIN-запит: від клієнта (з авто з гаража) або від гостя (VIN + телефон). */
export async function createVinRequestAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  const parsed = vinRequestSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), error: "Перевірте поля форми" };
  if (!user && !parsed.data.guestPhone) return { fieldErrors: { guestPhone: ["Вкажіть телефон, щоб менеджер міг відповісти"] } };
  let number: number;
  try {
    const attachments = await saveUploads(fd.getAll("files") as File[], "vin");
    const req = await vin.createVinRequest({ userId: user?.id ?? null, ...parsed.data, attachments });
    number = req.number;
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (user) redirect(`/account/vin-requests/${number}?created=1`);
  return { ok: true, message: `Запит №${number} надіслано. Менеджер зателефонує або напише вам найближчим часом.` };
}

export async function vinMessageAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const userId = await requireUid();
  const text = String(fd.get("text") ?? "").trim();
  const requestId = String(fd.get("requestId") ?? "");
  if (!text) return { fieldErrors: { text: ["Напишіть повідомлення"] } };
  try {
    const attachments = await saveUploads(fd.getAll("files") as File[], "vin");
    await vin.addCustomerMessage(userId, requestId, text, attachments);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/account/vin-requests", "layout");
  return { ok: true };
}

export async function closeVinRequestAction(requestId: string) {
  const userId = await requireUid();
  await vin.closeVinRequestByCustomer(userId, requestId);
  revalidatePath("/account/vin-requests", "layout");
}

/** «Додати все в кошик» / вибірково з відповіді менеджера. */
export async function addVinItemsToCartAction(requestId: string, itemIds?: string[]) {
  const userId = await requireUid();
  const req = await db.vinRequest.findFirst({ where: { id: requestId, userId }, include: { items: { include: { product: { select: { isActive: true } } } } } });
  if (!req) return { ok: false, error: "Запит не знайдено" };
  const items = req.items.filter((i) => i.product.isActive && (!itemIds || itemIds.includes(i.id)));
  await addManyToCart(userId, items.map((i) => ({ productId: i.productId, qty: i.qty })), req.vehicleId);
  revalidatePath("/", "layout");
  return { ok: true, count: await getCartCount(userId), added: items.length };
}

export async function updateProfileAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const userId = await requireUid();
  const parsed = profileSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  try {
    await users.updateProfile(userId, { name: parsed.data.name, phone: parsed.data.phone || undefined });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/account", "layout");
  return { message: "Дані збережено" };
}

export async function changePasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const userId = await requireUid();
  const parsed = passwordSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  try {
    await users.changePassword(userId, parsed.data.current, parsed.data.next);
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { message: "Пароль змінено" };
}

export async function saveAddressAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const userId = await requireUid();
  const parsed = addressSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  await users.saveAddress(userId, { ...parsed.data, id: String(fd.get("id") ?? "") || undefined });
  revalidatePath("/account/profile");
  return { message: "Адресу збережено", ok: true };
}

export async function deleteAddressAction(id: string) {
  const userId = await requireUid();
  await users.deleteAddress(userId, id);
  revalidatePath("/account/profile");
}
