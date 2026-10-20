import "server-only";
import type { VehicleKind } from "@prisma/client";
import { db } from "@/server/db";
import { slugify } from "@/lib/normalize";
import { logAudit } from "../audit";

// ── категорії ──
export async function adminCategoryTree() {
  const [cats, counts] = await Promise.all([
    db.category.findMany({ orderBy: [{ sort: "asc" }, { name: "asc" }] }),
    db.product.groupBy({ by: ["categoryId"], _count: { _all: true } }),
  ]);
  const cm = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  return cats
    .filter((c) => !c.parentId)
    .map((r) => ({ ...r, count: cm.get(r.id) ?? 0, children: cats.filter((c) => c.parentId === r.id).map((c) => ({ ...c, count: cm.get(c.id) ?? 0, children: [] as never[] })) }));
}

export async function adminSaveCategory(data: { id?: string; name: string; slug?: string; parentId?: string | null; icon?: string; description?: string; isActive: boolean }, byUserId: string) {
  const slug = slugify(data.slug || data.name);
  const clash = await db.category.findUnique({ where: { slug } });
  if (clash && clash.id !== data.id) throw new Error("Такий slug вже використовується");
  if (data.id && data.parentId === data.id) throw new Error("Категорія не може бути батьківською сама собі");
  if (data.id && data.parentId) {
    const hasChildren = await db.category.count({ where: { parentId: data.id } });
    if (hasChildren) throw new Error("Категорія з підкатегоріями може бути тільки кореневою");
  }
  const payload = { name: data.name, slug, parentId: data.parentId || null, icon: data.icon || null, description: data.description || null, isActive: data.isActive };
  const c = data.id
    ? await db.category.update({ where: { id: data.id }, data: payload })
    : await db.category.create({ data: { ...payload, sort: await db.category.count({ where: { parentId: data.parentId || null } }) } });
  await logAudit(byUserId, data.id ? "update" : "create", "Category", c.id, { name: c.name, slug: c.slug });
  return c;
}

/** Порядок після drag&drop: масив id у новому порядку в межах одного батька. */
export async function adminReorderCategories(parentId: string | null, ids: string[], byUserId: string) {
  await db.$transaction(ids.map((id, i) => db.category.update({ where: { id }, data: { sort: i, parentId } })));
  await logAudit(byUserId, "reorder", "Category", parentId ?? "root", { ids });
}

export async function adminDeleteCategory(id: string, byUserId: string) {
  const [products, children] = await Promise.all([db.product.count({ where: { categoryId: id } }), db.category.count({ where: { parentId: id } })]);
  if (products || children) throw new Error(`Неможливо видалити: ${products} товарів, ${children} підкатегорій`);
  const c = await db.category.delete({ where: { id } });
  await logAudit(byUserId, "delete", "Category", id, { name: c.name });
}

// ── бренди деталей ──
export async function adminListPartBrands() {
  return db.partBrand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
}
export async function adminSavePartBrand(data: { id?: string; name: string; isOriginal: boolean; country?: string }, byUserId: string) {
  const slug = slugify(data.name);
  const clash = await db.partBrand.findFirst({ where: { OR: [{ name: data.name }, { slug }], id: data.id ? { not: data.id } : undefined } });
  if (clash) throw new Error("Бренд з такою назвою вже існує");
  const b = data.id
    ? await db.partBrand.update({ where: { id: data.id }, data: { name: data.name, slug, isOriginal: data.isOriginal, country: data.country || null } })
    : await db.partBrand.create({ data: { name: data.name, slug, isOriginal: data.isOriginal, country: data.country || null } });
  await logAudit(byUserId, data.id ? "update" : "create", "PartBrand", b.id, { name: b.name });
  return b;
}
export async function adminDeletePartBrand(id: string, byUserId: string) {
  const n = await db.product.count({ where: { brandId: id } });
  if (n) throw new Error(`Бренд використовується в ${n} товарах`);
  await db.partBrand.delete({ where: { id } });
  await logAudit(byUserId, "delete", "PartBrand", id);
}

// ── марки, серії, двигуни ──
export async function adminListMakes() {
  return db.vehicleMake.findMany({
    orderBy: [{ kind: "asc" }, { sort: "asc" }],
    include: { series: { orderBy: { name: "asc" }, include: { engines: { orderBy: { code: "asc" } } } }, _count: { select: { vehicles: true, fitments: true } } },
  });
}
export async function adminSaveMake(data: { id?: string; name: string; kind: VehicleKind; wmiCodes: string[]; country?: string }, byUserId: string) {
  const payload = { name: data.name, slug: slugify(data.name), kind: data.kind, wmiCodes: data.wmiCodes.map((w) => w.toUpperCase()).filter(Boolean), country: data.country || null };
  const m = data.id ? await db.vehicleMake.update({ where: { id: data.id }, data: payload }) : await db.vehicleMake.create({ data: { ...payload, sort: await db.vehicleMake.count() } });
  await logAudit(byUserId, data.id ? "update" : "create", "VehicleMake", m.id, { name: m.name, wmi: m.wmiCodes });
}
export async function adminDeleteMake(id: string, byUserId: string) {
  const v = await db.vehicle.count({ where: { makeId: id } });
  if (v) throw new Error(`Марка є в гаражах клієнтів (${v} авто)`);
  await db.vehicleMake.delete({ where: { id } });
  await logAudit(byUserId, "delete", "VehicleMake", id);
}
export async function adminSaveSeries(data: { id?: string; makeId: string; name: string; yearFrom?: number; yearTo?: number }, byUserId: string) {
  const payload = { name: data.name, slug: slugify(data.name), yearFrom: data.yearFrom ?? null, yearTo: data.yearTo ?? null };
  const s = data.id ? await db.vehicleSeries.update({ where: { id: data.id }, data: payload }) : await db.vehicleSeries.create({ data: { ...payload, makeId: data.makeId } });
  await logAudit(byUserId, data.id ? "update" : "create", "VehicleSeries", s.id, { name: s.name });
}
export async function adminDeleteSeries(id: string, byUserId: string) {
  const v = await db.vehicle.count({ where: { seriesId: id } });
  if (v) throw new Error(`Серія є в гаражах клієнтів (${v} авто)`);
  await db.vehicleSeries.delete({ where: { id } });
  await logAudit(byUserId, "delete", "VehicleSeries", id);
}
export async function adminSaveEngine(data: { id?: string; seriesId: string; code: string; powerHp?: number; euroClass?: string }, byUserId: string) {
  const payload = { code: data.code, powerHp: data.powerHp ?? null, euroClass: data.euroClass || null };
  const e = data.id ? await db.engineCode.update({ where: { id: data.id }, data: payload }) : await db.engineCode.create({ data: { ...payload, seriesId: data.seriesId } });
  await logAudit(byUserId, data.id ? "update" : "create", "EngineCode", e.id, { code: e.code });
}
export async function adminDeleteEngine(id: string, byUserId: string) {
  const v = await db.vehicle.count({ where: { engineCodeId: id } });
  if (v) throw new Error(`Двигун є в гаражах клієнтів (${v} авто)`);
  await db.engineCode.delete({ where: { id } });
  await logAudit(byUserId, "delete", "EngineCode", id);
}

// ── комплекти ТО ──
export async function adminListKits() {
  return db.serviceKit.findMany({
    orderBy: { name: "asc" },
    include: { make: true, series: true, engineCode: true, items: { include: { product: { select: { id: true, name: true, article: true, price: true, brand: { select: { name: true } } } } } } },
  });
}
export async function adminGetKit(id: string) {
  return db.serviceKit.findUnique({
    where: { id },
    include: { items: { include: { product: { select: { id: true, name: true, article: true, price: true, stockStatus: true, brand: { select: { name: true } } } } } } },
  });
}
export async function adminSaveKit(
  data: { id?: string; name: string; description?: string; intervalKm?: number; makeId?: string; seriesId?: string; engineCodeId?: string; isActive: boolean; items: { productId: string; qty: number }[] },
  byUserId: string,
) {
  const slug = slugify(data.name);
  const clash = await db.serviceKit.findUnique({ where: { slug } });
  if (clash && clash.id !== data.id) throw new Error("Комплект з такою назвою вже існує");
  const payload = {
    name: data.name, slug, description: data.description || null, intervalKm: data.intervalKm ?? null,
    makeId: data.makeId || null, seriesId: data.seriesId || null, engineCodeId: data.engineCodeId || null, isActive: data.isActive,
  };
  const items = data.items.filter((i) => i.qty > 0);
  const kit = data.id
    ? await db.$transaction(async (tx) => {
        await tx.serviceKitItem.deleteMany({ where: { kitId: data.id } });
        return tx.serviceKit.update({ where: { id: data.id }, data: { ...payload, items: { create: items } } });
      })
    : await db.serviceKit.create({ data: { ...payload, items: { create: items } } });
  await logAudit(byUserId, data.id ? "update" : "create", "ServiceKit", kit.id, { name: kit.name, items: items.length });
  return kit;
}
export async function adminDeleteKit(id: string, byUserId: string) {
  await db.serviceKit.delete({ where: { id } });
  await logAudit(byUserId, "delete", "ServiceKit", id);
}
