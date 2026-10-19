import "server-only";
import { Prisma, type StockStatus } from "@prisma/client";
import type { z } from "zod";
import { db } from "@/server/db";
import { normalize, slugify } from "@/lib/normalize";
import { toNumber } from "@/lib/format";
import type { fitmentSchema, productSchema } from "@/lib/validators";
import { diffOf, logAudit } from "../audit";

type ProductInput = z.infer<typeof productSchema>;
type FitmentInput = z.infer<typeof fitmentSchema>;

export interface AdminProductFilters {
  q?: string; categoryId?: string; brandId?: string; stock?: StockStatus; flag?: "nophoto" | "noprice" | "inactive" | "nofit";
  page?: number; perPage?: number; sort?: string; dir?: "asc" | "desc";
}

export async function adminListProducts(f: AdminProductFilters) {
  const perPage = f.perPage ?? 50;
  const page = Math.max(1, f.page ?? 1);
  const and: Prisma.ProductWhereInput[] = [];
  if (f.q) {
    const n = normalize(f.q);
    and.push({
      OR: [
        { name: { contains: f.q, mode: "insensitive" } },
        { sku: { contains: f.q, mode: "insensitive" } },
        ...(n ? [{ articleNorm: { contains: n } }, { numbers: { some: { numberNorm: { contains: n } } } }] : []),
      ],
    });
  }
  if (f.categoryId) and.push({ OR: [{ categoryId: f.categoryId }, { category: { parentId: f.categoryId } }] });
  if (f.brandId) and.push({ brandId: f.brandId });
  if (f.stock) and.push({ stockStatus: f.stock });
  if (f.flag === "nophoto") and.push({ images: { none: {} } });
  if (f.flag === "noprice") and.push({ price: { lte: 0 } });
  if (f.flag === "inactive") and.push({ isActive: false });
  if (f.flag === "nofit") and.push({ fitments: { none: {} }, isUniversal: false });
  const where: Prisma.ProductWhereInput = { AND: and };
  const sortable = ["name", "price", "stockQty", "updatedAt", "article", "sku"];
  const orderBy = { [sortable.includes(f.sort ?? "") ? f.sort! : "updatedAt"]: f.dir ?? (f.sort ? "asc" : "desc") };
  const [rows, total] = await Promise.all([
    db.product.findMany({
      where, orderBy, skip: (page - 1) * perPage, take: perPage,
      include: { brand: { select: { name: true } }, category: { select: { name: true } }, _count: { select: { images: true, fitments: true, numbers: true } } },
    }),
    db.product.count({ where }),
  ]);
  return {
    total, page, perPage,
    items: rows.map((p) => ({
      id: p.id, sku: p.sku, article: p.article, name: p.name, slug: p.slug, brand: p.brand.name, category: p.category.name,
      price: toNumber(p.price), purchasePrice: p.purchasePrice ? toNumber(p.purchasePrice) : null, stockQty: p.stockQty, stockStatus: p.stockStatus,
      isActive: p.isActive, images: p._count.images, fitments: p._count.fitments, numbers: p._count.numbers, updatedAt: p.updatedAt.toISOString(),
    })),
  };
}

export type AdminProductRow = Awaited<ReturnType<typeof adminListProducts>>["items"][number];

export async function adminGetProduct(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      brand: true, category: true, images: { orderBy: { sort: "asc" } }, numbers: { orderBy: [{ type: "asc" }, { number: "asc" }] },
      attributes: { orderBy: { sort: "asc" } },
      fitments: { include: { make: true, series: true, engineCode: true }, orderBy: { id: "asc" } },
    },
  });
}

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = slugify(base) || "tovar";
  for (let i = 1; ; i++) {
    const ex = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (!ex || ex.id === excludeId) return slug;
    slug = `${slugify(base)}-${i}`;
  }
}

async function nextSku() {
  const last = await db.product.findFirst({ where: { sku: { startsWith: "TP-" } }, orderBy: { sku: "desc" }, select: { sku: true } });
  const n = last ? Number(last.sku.slice(3)) + 1 : 10001;
  return `TP-${n}`;
}

function dataFrom(input: ProductInput) {
  return {
    name: input.name,
    article: input.article,
    articleNorm: normalize(input.article),
    brandId: input.brandId,
    categoryId: input.categoryId,
    description: input.description ?? null,
    price: new Prisma.Decimal(input.price ?? 0),
    oldPrice: input.oldPrice != null ? new Prisma.Decimal(input.oldPrice) : null,
    purchasePrice: input.purchasePrice != null ? new Prisma.Decimal(input.purchasePrice) : null,
    stockQty: input.stockQty ?? 0,
    stockStatus: input.stockStatus,
    leadTimeDays: input.leadTimeDays ?? null,
    weightKg: input.weightKg != null ? new Prisma.Decimal(input.weightKg) : null,
    isActive: input.isActive,
    isPopular: input.isPopular,
    isUniversal: input.isUniversal,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
  };
}

export async function adminCreateProduct(input: ProductInput, byUserId: string) {
  const dup = await db.product.findFirst({ where: { articleNorm: normalize(input.article), brandId: input.brandId } });
  if (dup) throw new Error(`Товар з таким артикулом і брендом вже існує (${dup.sku})`);
  const p = await db.product.create({
    data: { ...dataFrom(input), sku: input.sku || (await nextSku()), slug: await uniqueSlug(input.slug || `${input.name}-${input.article}`) },
  });
  await logAudit(byUserId, "create", "Product", p.id, { sku: p.sku, article: p.article });
  return p;
}

export async function adminUpdateProduct(id: string, input: ProductInput, byUserId: string) {
  const before = await db.product.findUniqueOrThrow({ where: { id } });
  const dup = await db.product.findFirst({ where: { articleNorm: normalize(input.article), brandId: input.brandId, id: { not: id } } });
  if (dup) throw new Error(`Товар з таким артикулом і брендом вже існує (${dup.sku})`);
  const data = { ...dataFrom(input), ...(input.sku ? { sku: input.sku } : {}), ...(input.slug && input.slug !== before.slug ? { slug: await uniqueSlug(input.slug, id) } : {}) };
  await db.product.update({ where: { id }, data });
  await logAudit(byUserId, "update", "Product", id, diffOf(before as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>));
}

export async function adminDeleteProduct(id: string, byUserId: string) {
  const used = await db.orderItem.count({ where: { productId: id } });
  if (used) {
    await db.product.update({ where: { id }, data: { isActive: false } });
    await logAudit(byUserId, "deactivate", "Product", id, { reason: "є в замовленнях" });
    return "deactivated" as const;
  }
  const p = await db.product.delete({ where: { id } });
  await logAudit(byUserId, "delete", "Product", id, { sku: p.sku, article: p.article });
  return "deleted" as const;
}

/** Інлайн-редагування ціни / залишку в таблиці. */
export async function adminInlineUpdate(id: string, field: "price" | "stockQty", value: number, byUserId: string) {
  const before = await db.product.findUniqueOrThrow({ where: { id } });
  const data: Prisma.ProductUpdateInput =
    field === "price"
      ? { price: new Prisma.Decimal(value) }
      : { stockQty: Math.round(value), stockStatus: value <= 0 ? (before.stockStatus === "ON_ORDER" ? "ON_ORDER" : "OUT_OF_STOCK") : value <= 3 ? "LOW" : "IN_STOCK" };
  await db.product.update({ where: { id }, data });
  await logAudit(byUserId, "inline", "Product", id, { [field]: { from: field === "price" ? before.price.toString() : before.stockQty, to: value } });
}

export type BulkAction =
  | { type: "activate"; value: boolean }
  | { type: "stockStatus"; value: StockStatus }
  | { type: "category"; value: string }
  | { type: "pricePercent"; value: number }
  | { type: "popular"; value: boolean };

export async function adminBulkUpdate(ids: string[], action: BulkAction, byUserId: string) {
  if (!ids.length) return 0;
  switch (action.type) {
    case "activate":
      await db.product.updateMany({ where: { id: { in: ids } }, data: { isActive: action.value } });
      break;
    case "popular":
      await db.product.updateMany({ where: { id: { in: ids } }, data: { isPopular: action.value } });
      break;
    case "stockStatus":
      await db.product.updateMany({ where: { id: { in: ids } }, data: { stockStatus: action.value } });
      break;
    case "category":
      await db.product.updateMany({ where: { id: { in: ids } }, data: { categoryId: action.value } });
      break;
    case "pricePercent": {
      const k = 1 + action.value / 100;
      await db.$executeRaw`UPDATE "Product" SET price = ROUND(price * ${k}::numeric, 0), "updatedAt" = now() WHERE id IN (${Prisma.join(ids)})`;
      break;
    }
  }
  await logAudit(byUserId, "bulk", "Product", `${ids.length} товарів`, { action: action.type, value: String(action.value), ids });
  return ids.length;
}

// ── номери ──
export async function adminAddNumber(productId: string, number: string, type: "OE" | "CROSS", brandName: string | undefined, byUserId: string) {
  const numberNorm = normalize(number);
  if (!numberNorm) throw new Error("Порожній номер");
  await db.productNumber.create({ data: { productId, number: number.trim(), numberNorm, type, brandName } });
  await logAudit(byUserId, "add-number", "Product", productId, { number, type });
}
export async function adminDeleteNumber(id: string, byUserId: string) {
  const n = await db.productNumber.delete({ where: { id } });
  await logAudit(byUserId, "remove-number", "Product", n.productId, { number: n.number });
}

// ── застосовність ──
export async function adminAddFitment(productId: string, input: FitmentInput, byUserId: string) {
  const f = await db.fitment.create({ data: { productId, ...input, axleBrand: input.axleBrand?.toUpperCase() } });
  await logAudit(byUserId, "add-fitment", "Product", productId, JSON.parse(JSON.stringify(input)));
  return f;
}
export async function adminDeleteFitment(id: string, byUserId: string) {
  const f = await db.fitment.delete({ where: { id } });
  await logAudit(byUserId, "remove-fitment", "Product", f.productId, { fitmentId: id });
}

// ── атрибути ──
export async function adminSaveAttributes(productId: string, attrs: { name: string; value: string }[], byUserId: string) {
  const clean = attrs.filter((a) => a.name.trim() && a.value.trim());
  await db.$transaction([
    db.productAttribute.deleteMany({ where: { productId } }),
    db.productAttribute.createMany({ data: clean.map((a, i) => ({ productId, name: a.name.trim(), value: a.value.trim(), sort: i })) }),
  ]);
  await logAudit(byUserId, "attributes", "Product", productId, { count: clean.length });
}

// ── фото ──
export async function adminAddImages(productId: string, urls: string[], byUserId: string) {
  const max = await db.productImage.aggregate({ where: { productId }, _max: { sort: true } });
  let sort = (max._max.sort ?? -1) + 1;
  await db.productImage.createMany({ data: urls.map((url) => ({ productId, url, sort: sort++ })) });
  await logAudit(byUserId, "add-images", "Product", productId, { count: urls.length });
}
export async function adminDeleteImage(id: string, byUserId: string) {
  const img = await db.productImage.delete({ where: { id } });
  await logAudit(byUserId, "remove-image", "Product", img.productId, { url: img.url });
}
export async function adminMoveImage(id: string, dir: -1 | 1) {
  const img = await db.productImage.findUniqueOrThrow({ where: { id } });
  const all = await db.productImage.findMany({ where: { productId: img.productId }, orderBy: { sort: "asc" } });
  const i = all.findIndex((x) => x.id === id);
  const j = i + dir;
  if (j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  await db.$transaction(all.map((x, k) => db.productImage.update({ where: { id: x.id }, data: { sort: k } })));
}

/** Швидкий пошук товарів для вибору (замовлення, VIN-відповідь, комплекти). */
export async function adminPickProducts(q: string) {
  const n = normalize(q);
  const rows = await db.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { equals: q, mode: "insensitive" } },
        ...(n.length >= 2 ? [{ articleNorm: { startsWith: n } }, { numbers: { some: { numberNorm: { startsWith: n } } } }] : []),
      ],
    },
    include: { brand: { select: { name: true } }, numbers: { select: { number: true, type: true } } },
    take: 15,
    orderBy: [{ isActive: "desc" }, { stockStatus: "asc" }],
  });
  return rows.map((p) => ({
    id: p.id, name: p.name, article: p.article, brand: p.brand.name, price: toNumber(p.price), stockStatus: p.stockStatus, stockQty: p.stockQty,
    isActive: p.isActive, oe: p.numbers.filter((x) => x.type === "OE").map((x) => x.number), slug: p.slug,
  }));
}

export type PickedProduct = Awaited<ReturnType<typeof adminPickProducts>>[number];
