"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OrderStatus, Role, VehicleKind, VinRequestStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { assertRole } from "@/server/auth/guards";
import * as orders from "@/server/services/orders";
import * as vin from "@/server/services/vinRequests";
import * as users from "@/server/services/users";
import * as products from "@/server/services/admin/products";
import * as catalog from "@/server/services/admin/catalog";
import * as content from "@/server/services/admin/content";
import * as imp from "@/server/services/admin/import";
import { SETTING_KEYS, setSetting } from "@/server/services/settings";
import { logAudit } from "@/server/services/audit";
import { saveUploads } from "@/server/services/uploads";
import { fieldErrorsOf, fitmentSchema, formToObject, productSchema, type ActionState } from "@/lib/validators";

type Result = { ok: boolean; error?: string; message?: string };

async function run(fn: () => Promise<unknown>, paths: string[] = []): Promise<Result> {
  try {
    await fn();
    for (const p of paths) revalidatePath(p, "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optNum = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v ? Number(v.replace(/\s/g, "")) : undefined;
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

// ───────── замовлення ─────────
export async function setOrderStatusAction(orderId: string, status: OrderStatus, comment?: string) {
  const u = await assertRole("MANAGER");
  return run(() => orders.adminSetOrderStatus(orderId, status, comment || undefined, u.id), ["/admin"]);
}
export async function updateOrderItemAction(orderId: string, itemId: string, qty: number, price: number) {
  const u = await assertRole("MANAGER");
  return run(() => orders.adminUpdateOrderItem(orderId, itemId, qty, price, u.id), ["/admin"]);
}
export async function addOrderItemAction(orderId: string, productId: string, qty = 1) {
  const u = await assertRole("MANAGER");
  return run(() => orders.adminAddOrderItem(orderId, productId, qty, u.id), ["/admin"]);
}
export async function updateOrderMetaAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  const r = await run(() => orders.adminUpdateOrderMeta(str(fd, "id"), {
    managerComment: str(fd, "managerComment") || null, contactName: str(fd, "contactName"), contactPhone: str(fd, "contactPhone"),
    deliveryCity: str(fd, "deliveryCity") || null, deliveryBranch: str(fd, "deliveryBranch") || null,
  }, u.id), ["/admin"]);
  return r.ok ? { message: "Збережено" } : { error: r.error };
}

// ───────── VIN-запити ─────────
export async function vinAssignAction(id: string) {
  const u = await assertRole("MANAGER");
  return run(() => vin.adminAssign(id, u.id), ["/admin"]);
}
export async function vinAddItemAction(id: string, productId: string, qty: number, comment?: string) {
  const u = await assertRole("MANAGER");
  return run(() => vin.adminAddItem(id, productId, qty, comment, u.id), ["/admin"]);
}
export async function vinRemoveItemAction(id: string, itemId: string) {
  const u = await assertRole("MANAGER");
  return run(() => vin.adminRemoveItem(id, itemId, u.id), ["/admin"]);
}
export async function vinAnswerAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  const r = await run(() => vin.adminAnswer(str(fd, "id"), str(fd, "text"), u.id), ["/admin", "/account"]);
  return r.ok ? { ok: true, message: "Відповідь надіслано клієнту" } : { error: r.error };
}
export async function vinMessageAdminAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  const text = str(fd, "text");
  if (!text) return { fieldErrors: { text: ["Порожнє повідомлення"] } };
  const r = await run(() => vin.adminMessage(str(fd, "id"), text, u.id), ["/admin", "/account"]);
  return r.ok ? { ok: true } : { error: r.error };
}
export async function vinSetStatusAction(id: string, status: VinRequestStatus) {
  const u = await assertRole("MANAGER");
  return run(() => vin.adminSetStatus(id, status, u.id), ["/admin"]);
}
export async function vinLinkOeAction(vehicleId: string, number: string, label?: string) {
  const u = await assertRole("MANAGER");
  return run(() => vin.adminLinkOe(vehicleId, number, label || undefined, u.id), ["/admin", "/account"]);
}
export async function vinUnlinkOeAction(oeId: string) {
  const u = await assertRole("MANAGER");
  return run(() => vin.adminUnlinkOe(oeId, u.id), ["/admin", "/account"]);
}

// ───────── клієнти ─────────
export async function customerNoteAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  const r = await run(() => users.adminSetCustomerNote(str(fd, "id"), str(fd, "note"), u.id), ["/admin"]);
  return r.ok ? { message: "Нотатку збережено" } : { error: r.error };
}

// ───────── товари ─────────
export async function saveProductAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  const parsed = productSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), error: "Перевірте поля" };
  const id = str(fd, "id");
  let newId = id;
  try {
    if (id) await products.adminUpdateProduct(id, parsed.data, u.id);
    else newId = (await products.adminCreateProduct(parsed.data, u.id)).id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/products/${newId}?created=1`);
  return { message: "Збережено" };
}
export async function deleteProductAction(id: string) {
  const u = await assertRole("MANAGER");
  const res = await products.adminDeleteProduct(id, u.id);
  revalidatePath("/", "layout");
  redirect(`/admin/products?${res}=1`);
}
export async function inlineProductAction(id: string, field: "price" | "stockQty", value: number) {
  const u = await assertRole("MANAGER");
  if (!Number.isFinite(value) || value < 0) return { ok: false, error: "Некоректне значення" };
  return run(() => products.adminInlineUpdate(id, field, value, u.id), ["/"]);
}
export async function bulkProductsAction(ids: string[], action: products.BulkAction) {
  const u = await assertRole("MANAGER");
  return run(() => products.adminBulkUpdate(ids, action, u.id), ["/"]);
}
export async function addNumberAction(productId: string, number: string, type: "OE" | "CROSS", brandName?: string) {
  const u = await assertRole("MANAGER");
  return run(() => products.adminAddNumber(productId, number, type, brandName || undefined, u.id), ["/"]);
}
export async function deleteNumberAction(id: string) {
  const u = await assertRole("MANAGER");
  return run(() => products.adminDeleteNumber(id, u.id), ["/"]);
}
export async function addFitmentAction(productId: string, raw: Record<string, string>) {
  const u = await assertRole("MANAGER");
  const parsed = fitmentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: Object.values(fieldErrorsOf(parsed.error)).flat()[0] ?? "Некоректні дані" };
  return run(() => products.adminAddFitment(productId, parsed.data, u.id), ["/"]);
}
export async function deleteFitmentAction(id: string) {
  const u = await assertRole("MANAGER");
  return run(() => products.adminDeleteFitment(id, u.id), ["/"]);
}
export async function saveAttributesAction(productId: string, attrs: { name: string; value: string }[]) {
  const u = await assertRole("MANAGER");
  return run(() => products.adminSaveAttributes(productId, attrs, u.id), ["/"]);
}
export async function uploadProductImagesAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  try {
    const urls = await saveUploads(fd.getAll("files") as File[], "products", 10);
    if (!urls.length) return { error: "Оберіть файли" };
    await products.adminAddImages(str(fd, "productId"), urls, u.id);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Фото завантажено" };
}
export async function deleteImageAction(id: string) {
  const u = await assertRole("MANAGER");
  return run(() => products.adminDeleteImage(id, u.id), ["/"]);
}
export async function moveImageAction(id: string, dir: -1 | 1) {
  await assertRole("MANAGER");
  return run(() => products.adminMoveImage(id, dir), ["/"]);
}
export async function pickProductsAction(q: string) {
  await assertRole("MANAGER");
  return q.trim().length < 2 ? [] : products.adminPickProducts(q.trim());
}

// ───────── категорії, бренди, марки ─────────
export async function saveCategoryAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  if (!str(fd, "name")) return { fieldErrors: { name: ["Вкажіть назву"] } };
  const r = await run(() => catalog.adminSaveCategory({
    id: str(fd, "id") || undefined, name: str(fd, "name"), slug: str(fd, "slug"), parentId: str(fd, "parentId") || null,
    icon: str(fd, "icon"), description: str(fd, "description"), isActive: bool(fd, "isActive"),
  }, u.id), ["/"]);
  return r.ok ? { ok: true, message: "Збережено" } : { error: r.error };
}
export async function reorderCategoriesAction(parentId: string | null, ids: string[]) {
  const u = await assertRole("MANAGER");
  return run(() => catalog.adminReorderCategories(parentId, ids, u.id), ["/"]);
}
export async function deleteCategoryAction(id: string) {
  const u = await assertRole("MANAGER");
  return run(() => catalog.adminDeleteCategory(id, u.id), ["/"]);
}
export async function savePartBrandAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  if (!str(fd, "name")) return { fieldErrors: { name: ["Вкажіть назву"] } };
  const r = await run(() => catalog.adminSavePartBrand({ id: str(fd, "id") || undefined, name: str(fd, "name"), isOriginal: bool(fd, "isOriginal"), country: str(fd, "country") }, u.id), ["/"]);
  return r.ok ? { ok: true, message: "Збережено" } : { error: r.error };
}
export async function deletePartBrandAction(id: string) {
  const u = await assertRole("MANAGER");
  return run(() => catalog.adminDeletePartBrand(id, u.id), ["/"]);
}
export async function saveMakeAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  if (!str(fd, "name")) return { fieldErrors: { name: ["Вкажіть назву"] } };
  const r = await run(() => catalog.adminSaveMake({
    id: str(fd, "id") || undefined, name: str(fd, "name"), kind: (str(fd, "kind") || "TRACTOR") as VehicleKind,
    wmiCodes: str(fd, "wmiCodes").split(/[\s,]+/).filter(Boolean), country: str(fd, "country"),
  }, u.id), ["/"]);
  return r.ok ? { ok: true, message: "Збережено" } : { error: r.error };
}
export async function deleteMakeAction(id: string) {
  const u = await assertRole("MANAGER");
  return run(() => catalog.adminDeleteMake(id, u.id), ["/"]);
}
export async function saveSeriesAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  if (!str(fd, "name")) return { fieldErrors: { name: ["Вкажіть назву"] } };
  const r = await run(() => catalog.adminSaveSeries({ id: str(fd, "id") || undefined, makeId: str(fd, "makeId"), name: str(fd, "name"), yearFrom: optNum(fd, "yearFrom"), yearTo: optNum(fd, "yearTo") }, u.id), ["/"]);
  return r.ok ? { ok: true, message: "Збережено" } : { error: r.error };
}
export async function deleteSeriesAction(id: string) {
  const u = await assertRole("MANAGER");
  return run(() => catalog.adminDeleteSeries(id, u.id), ["/"]);
}
export async function saveEngineAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  if (!str(fd, "code")) return { fieldErrors: { code: ["Вкажіть код"] } };
  const r = await run(() => catalog.adminSaveEngine({ id: str(fd, "id") || undefined, seriesId: str(fd, "seriesId"), code: str(fd, "code"), powerHp: optNum(fd, "powerHp"), euroClass: str(fd, "euroClass") }, u.id), ["/"]);
  return r.ok ? { ok: true, message: "Збережено" } : { error: r.error };
}
export async function deleteEngineAction(id: string) {
  const u = await assertRole("MANAGER");
  return run(() => catalog.adminDeleteEngine(id, u.id), ["/"]);
}

// ───────── комплекти ТО ─────────
export async function saveKitAction(data: { id?: string; name: string; description?: string; intervalKm?: number; makeId?: string; seriesId?: string; engineCodeId?: string; isActive: boolean; items: { productId: string; qty: number }[] }) {
  const u = await assertRole("MANAGER");
  if (!data.name.trim()) return { ok: false, error: "Вкажіть назву" };
  if (!data.items.length) return { ok: false, error: "Додайте хоча б один товар" };
  let id = data.id;
  const r = await run(async () => { id = (await catalog.adminSaveKit(data, u.id)).id; }, ["/"]);
  return { ...r, id };
}
export async function deleteKitAction(id: string) {
  const u = await assertRole("MANAGER");
  await catalog.adminDeleteKit(id, u.id);
  revalidatePath("/", "layout");
  redirect("/admin/kits");
}

// ───────── контент ─────────
export async function saveBannerAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  if (!str(fd, "title")) return { fieldErrors: { title: ["Вкажіть заголовок"] } };
  const r = await run(() => content.adminSaveBanner({
    id: str(fd, "id") || undefined, title: str(fd, "title"), subtitle: str(fd, "subtitle"), link: str(fd, "link"), linkText: str(fd, "linkText"),
    imageUrl: str(fd, "imageUrl"), sort: optNum(fd, "sort") ?? 0, isActive: bool(fd, "isActive"),
  }, u.id), ["/"]);
  return r.ok ? { ok: true, message: "Збережено" } : { error: r.error };
}
export async function deleteBannerAction(id: string) {
  const u = await assertRole("MANAGER");
  return run(() => content.adminDeleteBanner(id, u.id), ["/"]);
}
export async function savePageAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  if (!str(fd, "title") || !str(fd, "slug")) return { error: "Вкажіть заголовок і slug" };
  const r = await run(() => content.adminSavePage({ id: str(fd, "id") || undefined, slug: str(fd, "slug"), title: str(fd, "title"), content: String(fd.get("content") ?? "") }, u.id), ["/"]);
  return r.ok ? { ok: true, message: "Сторінку збережено" } : { error: r.error };
}
export async function saveFaqAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("MANAGER");
  if (!str(fd, "question") || !str(fd, "answer")) return { error: "Заповніть питання і відповідь" };
  const r = await run(() => content.adminSaveFaq({ id: str(fd, "id") || undefined, question: str(fd, "question"), answer: str(fd, "answer"), sort: optNum(fd, "sort") ?? 0, isActive: bool(fd, "isActive") }, u.id), ["/"]);
  return r.ok ? { ok: true, message: "Збережено" } : { error: r.error };
}
export async function deleteFaqAction(id: string) {
  const u = await assertRole("MANAGER");
  return run(() => content.adminDeleteFaq(id, u.id), ["/"]);
}

// ───────── налаштування (ADMIN) ─────────
export async function saveSettingsAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("ADMIN");
  const section = str(fd, "section") as keyof typeof SETTING_KEYS;
  let value: Prisma.InputJsonValue;
  switch (section) {
    case "general":
      value = { name: str(fd, "name"), tagline: str(fd, "tagline"), phone: str(fd, "phone"), phone2: str(fd, "phone2"), email: str(fd, "email"), address: str(fd, "address"), schedule: str(fd, "schedule"), telegram: str(fd, "telegram") };
      break;
    case "commerce":
      value = {
        currency: "UAH", eurRate: optNum(fd, "eurRate") ?? 0, defaultMarkupPercent: optNum(fd, "defaultMarkupPercent") ?? 0, freeShippingFrom: optNum(fd, "freeShippingFrom") ?? 0,
        deliveryMethods: fd.getAll("deliveryMethods").map(String), paymentMethods: fd.getAll("paymentMethods").map(String),
      };
      if (!(value as { deliveryMethods: string[] }).deliveryMethods.length) return { error: "Залиште хоча б один спосіб доставки" };
      if (!(value as { paymentMethods: string[] }).paymentMethods.length) return { error: "Залиште хоча б один спосіб оплати" };
      break;
    case "vin":
      value = { slaHours: optNum(fd, "slaHours") ?? 2, notifyEmail: str(fd, "notifyEmail") };
      break;
    case "notifications":
      value = { orderEmail: str(fd, "orderEmail"), sendCustomerEmails: bool(fd, "sendCustomerEmails") };
      break;
    case "synonyms":
      value = str(fd, "synonyms").split("\n").map((l) => l.split(/[,;]/).map((x) => x.trim().toLowerCase()).filter(Boolean)).filter((g) => g.length > 1);
      break;
    default:
      return { error: "Невідомий розділ" };
  }
  await setSetting(SETTING_KEYS[section], value);
  await logAudit(u.id, "update", "Setting", SETTING_KEYS[section], value);
  revalidatePath("/", "layout");
  return { message: "Налаштування збережено" };
}

// ───────── користувачі (ADMIN) ─────────
export async function createStaffAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await assertRole("ADMIN");
  const email = str(fd, "email");
  const password = str(fd, "password");
  if (!email.includes("@")) return { fieldErrors: { email: ["Некоректний email"] } };
  if (password && password.length < 8) return { fieldErrors: { password: ["Мінімум 8 символів"] } };
  const r = await run(() => users.adminCreateStaff({ name: str(fd, "name") || email, email, role: (str(fd, "role") || "MANAGER") as Role, password: password || "demo1234" }, u.id), ["/admin"]);
  return r.ok ? { ok: true, message: "Збережено" } : { error: r.error };
}
export async function updateUserAction(id: string, data: { role?: Role; isActive?: boolean }) {
  const u = await assertRole("ADMIN");
  return run(() => users.adminUpdateUser(id, data, u.id), ["/admin"]);
}

// ───────── імпорт (ADMIN) ─────────
export async function importUploadAction(fd: FormData) {
  await assertRole("ADMIN");
  const file = fd.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false as const, error: "Оберіть файл" };
  if (file.size > 10 * 1024 * 1024) return { ok: false as const, error: "Файл більший за 10 МБ" };
  try {
    return { ok: true as const, ...(await imp.parseUpload(file)), templates: await imp.getTemplates() };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
export async function importPreviewAction(fileId: string, mapping: imp.Mapping, opts: imp.ImportOptions) {
  await assertRole("ADMIN");
  try {
    return { ok: true as const, rows: await imp.previewImport(fileId, mapping, opts) };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
export async function importRunAction(fileId: string, mapping: imp.Mapping, opts: imp.ImportOptions) {
  const u = await assertRole("ADMIN");
  try {
    const job = await imp.runImport(fileId, mapping, opts, u.id);
    revalidatePath("/", "layout");
    return { ok: true as const, job: { id: job.id, total: job.total, created: job.created, updated: job.updated, skipped: job.skipped, errors: (job.errors ?? []) as { row: number; message: string }[] } };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
export async function saveTemplateAction(name: string, mapping: imp.Mapping) {
  await assertRole("ADMIN");
  if (!name.trim()) return { ok: false, error: "Вкажіть назву шаблону" };
  await imp.saveTemplate(name.trim(), mapping);
  return { ok: true, templates: await imp.getTemplates() };
}
export async function deleteTemplateAction(name: string) {
  await assertRole("ADMIN");
  await imp.deleteTemplate(name);
  return { ok: true, templates: await imp.getTemplates() };
}

