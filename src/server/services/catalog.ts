import "server-only";
import { cache } from "react";
import type { Prisma, StockStatus } from "@prisma/client";
import { db } from "@/server/db";
import { toNumber } from "@/lib/format";
import { evaluateFit, fitmentSelect, whereForVehicle, type FitResult, type VehicleContext } from "./fitment";

export const productCardSelect = {
  id: true, slug: true, name: true, article: true, articleNorm: true, price: true, oldPrice: true,
  stockQty: true, stockStatus: true, leadTimeDays: true, isUniversal: true,
  brand: { select: { name: true, isOriginal: true } },
  category: { select: { icon: true, name: true } },
  images: { select: { url: true }, orderBy: { sort: "asc" }, take: 1 },
  numbers: { select: { numberNorm: true } },
  fitments: { select: fitmentSelect },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

/** Плаский DTO для клієнтських компонентів (без Decimal). */
export interface ProductCardDTO {
  id: string; slug: string; name: string; article: string; brand: string; isOriginal: boolean;
  price: number; oldPrice: number | null; stockQty: number; stockStatus: StockStatus; leadTimeDays: number | null;
  image: string | null; icon: string | null; categoryName: string; fit: FitResult | null;
}

export function toCard(p: CardRow, ctx: VehicleContext | null): ProductCardDTO {
  return {
    id: p.id, slug: p.slug, name: p.name, article: p.article, brand: p.brand.name, isOriginal: p.brand.isOriginal,
    price: toNumber(p.price), oldPrice: p.oldPrice ? toNumber(p.oldPrice) : null,
    stockQty: p.stockQty, stockStatus: p.stockStatus, leadTimeDays: p.leadTimeDays,
    image: p.images[0]?.url ?? null, icon: p.category.icon, categoryName: p.category.name,
    fit: ctx ? evaluateFit(p, ctx) : null,
  };
}

export const getCategoryTree = cache(async () => {
  const [cats, counts] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: [{ sort: "asc" }, { name: "asc" }] }),
    db.product.groupBy({ by: ["categoryId"], where: { isActive: true }, _count: { _all: true } }),
  ]);
  const countMap = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  const roots = cats.filter((c) => !c.parentId);
  return roots.map((r) => {
    const children = cats.filter((c) => c.parentId === r.id).map((c) => ({ ...c, count: countMap.get(c.id) ?? 0 }));
    return { ...r, children, count: (countMap.get(r.id) ?? 0) + children.reduce((s, c) => s + c.count, 0) };
  });
});

export type CategoryNode = Awaited<ReturnType<typeof getCategoryTree>>[number];

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: { parent: true, children: { where: { isActive: true }, orderBy: { sort: "asc" } } },
  });
}

export type SortKey = "popular" | "price_asc" | "price_desc" | "new" | "name";

export interface ProductFilters {
  categoryIds?: string[];
  brandSlugs?: string[];
  makeSlug?: string;
  seriesId?: string;
  axleBrand?: string;
  trailerOnly?: boolean;
  inStock?: boolean;
  priceMin?: number;
  priceMax?: number;
  attrs?: Record<string, string[]>;
  onlyFit?: boolean;
  ids?: string[];
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

function buildWhere(f: ProductFilters, ctx: VehicleContext | null, omit?: "brand"): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ isActive: true }];
  if (f.categoryIds?.length) and.push({ categoryId: { in: f.categoryIds } });
  if (f.ids) and.push({ id: { in: f.ids } });
  if (f.brandSlugs?.length && omit !== "brand") and.push({ brand: { slug: { in: f.brandSlugs } } });
  if (f.makeSlug) and.push({ OR: [{ fitments: { some: { make: { slug: f.makeSlug } } } }, { isUniversal: true }] });
  if (f.seriesId) and.push({ fitments: { some: { OR: [{ seriesId: f.seriesId }, { seriesId: null, series: null, make: { series: { some: { id: f.seriesId } } } }] } } });
  if (f.trailerOnly) and.push({ fitments: { some: { OR: [{ axleBrand: { not: null } }, { make: { kind: "TRAILER" } }] } } });
  if (f.axleBrand) and.push({ fitments: { some: { axleBrand: { equals: f.axleBrand, mode: "insensitive" } } } });
  if (f.inStock) and.push({ stockStatus: { in: ["IN_STOCK", "LOW"] } });
  if (f.priceMin != null) and.push({ price: { gte: f.priceMin } });
  if (f.priceMax != null) and.push({ price: { lte: f.priceMax } });
  for (const [name, values] of Object.entries(f.attrs ?? {}))
    if (values.length) and.push({ attributes: { some: { name, value: { in: values } } } });
  if (f.onlyFit && ctx) and.push(whereForVehicle(ctx));
  return { AND: and };
}

function orderBy(sort: SortKey = "popular"): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc": return [{ price: "asc" }];
    case "price_desc": return [{ price: "desc" }];
    case "new": return [{ createdAt: "desc" }];
    case "name": return [{ name: "asc" }];
    default: return [{ isPopular: "desc" }, { stockStatus: "asc" }, { name: "asc" }];
  }
}

export async function listProducts(f: ProductFilters, ctx: VehicleContext | null) {
  const perPage = f.perPage ?? 24;
  const page = Math.max(1, f.page ?? 1);
  const where = buildWhere(f, ctx);
  const [rows, total] = await Promise.all([
    db.product.findMany({ where, select: productCardSelect, orderBy: orderBy(f.sort), skip: (page - 1) * perPage, take: perPage }),
    db.product.count({ where }),
  ]);
  return { items: rows.map((r) => toCard(r, ctx)), total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** Фасети для фільтрів: бренди деталей, марки авто, ціновий діапазон, атрибути. */
export async function getFacets(f: ProductFilters, ctx: VehicleContext | null) {
  const base = buildWhere({ ...f, brandSlugs: undefined, priceMin: undefined, priceMax: undefined, attrs: undefined, makeSlug: undefined }, ctx);
  const [brandGroups, price, attrRows, makes] = await Promise.all([
    db.product.groupBy({ by: ["brandId"], where: buildWhere(f, ctx, "brand"), _count: { _all: true } }),
    db.product.aggregate({ where: base, _min: { price: true }, _max: { price: true } }),
    f.categoryIds?.length
      ? db.productAttribute.groupBy({ by: ["name", "value"], where: { product: base }, _count: { _all: true } })
      : Promise.resolve([]),
    db.vehicleMake.findMany({ where: { fitments: { some: { product: base } } }, select: { name: true, slug: true }, orderBy: { sort: "asc" } }),
  ]);
  const brands = await db.partBrand.findMany({ where: { id: { in: brandGroups.map((b) => b.brandId) } }, select: { id: true, name: true, slug: true, isOriginal: true } });
  const countMap = new Map(brandGroups.map((b) => [b.brandId, b._count._all]));

  // атрибути з невеликою кількістю значень — придатні для фільтра
  const byName = new Map<string, { value: string; count: number }[]>();
  for (const r of attrRows) {
    const list = byName.get(r.name) ?? [];
    list.push({ value: r.value, count: r._count._all });
    byName.set(r.name, list);
  }
  const attributes = [...byName.entries()]
    .filter(([, vals]) => vals.length >= 2 && vals.length <= 8)
    .slice(0, 4)
    .map(([name, values]) => ({ name, values: values.sort((a, b) => a.value.localeCompare(b.value, "uk", { numeric: true })) }));

  return {
    brands: brands.map((b) => ({ ...b, count: countMap.get(b.id) ?? 0 })).sort((a, b) => a.name.localeCompare(b.name)),
    makes,
    price: { min: toNumber(price._min.price), max: toNumber(price._max.price) },
    attributes,
  };
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      category: { include: { parent: true } },
      images: { orderBy: { sort: "asc" } },
      numbers: { orderBy: [{ type: "asc" }, { number: "asc" }] },
      attributes: { orderBy: { sort: "asc" } },
      fitments: {
        include: { make: true, series: true, engineCode: true },
        orderBy: [{ make: { sort: "asc" } }, { yearFrom: "asc" }],
      },
      kitItems: { include: { kit: { select: { name: true, slug: true } } } },
    },
  });
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/** Аналоги — товари, що мають спільний номер (OE/крос) або чий артикул є в номерах цього товару. */
export async function getAnalogs(p: { id: string; articleNorm: string; numbers: { numberNorm: string }[] }, ctx: VehicleContext | null) {
  const nums = [...new Set([p.articleNorm, ...p.numbers.map((n) => n.numberNorm)])];
  const rows = await db.product.findMany({
    where: {
      id: { not: p.id },
      isActive: true,
      OR: [{ articleNorm: { in: nums } }, { numbers: { some: { numberNorm: { in: nums } } } }],
    },
    select: productCardSelect,
    orderBy: [{ stockStatus: "asc" }, { price: "asc" }],
    take: 12,
  });
  return rows.map((r) => toCard(r, ctx));
}

export async function getPopularProducts(ctx: VehicleContext | null, take = 8) {
  const rows = await db.product.findMany({
    where: { isActive: true, isPopular: true }, select: productCardSelect, take, orderBy: { name: "asc" },
  });
  return rows.map((r) => toCard(r, ctx));
}

export async function getVehicleMakes(kind?: "TRAILER" | "TRACTOR") {
  return db.vehicleMake.findMany({
    where: { isActive: true, ...(kind === "TRAILER" ? { kind: "TRAILER" } : kind ? { kind: { not: "TRAILER" } } : {}) },
    orderBy: { sort: "asc" },
    include: { series: { orderBy: { yearFrom: "asc" }, include: { engines: { orderBy: { code: "asc" } } } } },
  });
}

export async function getMakeBySlug(slug: string) {
  return db.vehicleMake.findUnique({
    where: { slug },
    include: { series: { orderBy: { yearFrom: "asc" }, include: { engines: true } } },
  });
}

/** Категорії, у яких є товари для марки — для посадкової сторінки марки. */
export async function getCategoriesForMake(makeId: string, seriesId?: string) {
  const groups = await db.product.groupBy({
    by: ["categoryId"],
    where: { isActive: true, fitments: { some: { makeId, ...(seriesId ? { OR: [{ seriesId }, { seriesId: null }] } : {}) } } },
    _count: { _all: true },
  });
  const cats = await db.category.findMany({ where: { id: { in: groups.map((g) => g.categoryId) } }, include: { parent: true } });
  const counts = new Map(groups.map((g) => [g.categoryId, g._count._all]));
  return cats.map((c) => ({ ...c, count: counts.get(c.id) ?? 0 })).sort((a, b) => b.count - a.count);
}

export async function getKits(filter?: { makeId?: string }) {
  return db.serviceKit.findMany({
    where: { isActive: true, ...(filter?.makeId ? { makeId: filter.makeId } : {}) },
    include: {
      make: true, series: true, engineCode: true,
      items: { include: { product: { select: { id: true, name: true, price: true, article: true, slug: true, stockStatus: true, brand: { select: { name: true } } } } } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getKitBySlug(slug: string) {
  return db.serviceKit.findUnique({
    where: { slug },
    include: {
      make: true, series: true, engineCode: true,
      items: { include: { product: { select: productCardSelect } } },
    },
  });
}

export function kitTotal(items: { qty: number; product: { price: Prisma.Decimal } }[]) {
  return items.reduce((s, i) => s + toNumber(i.product.price) * i.qty, 0);
}

export async function getPage(slug: string) {
  return db.page.findUnique({ where: { slug } });
}

export async function getBanners() {
  return db.banner.findMany({ where: { isActive: true }, orderBy: { sort: "asc" } });
}

export async function getFaq() {
  return db.faq.findMany({ where: { isActive: true }, orderBy: { sort: "asc" } });
}

export async function getVehicleDirectory() {
  return db.vehicleMake.findMany({
    where: { isActive: true },
    orderBy: { sort: "asc" },
    select: {
      id: true, name: true, kind: true,
      series: { select: { id: true, name: true, yearFrom: true, yearTo: true, engines: { select: { id: true, code: true, powerHp: true, euroClass: true } } }, orderBy: { name: "asc" } },
    },
  });
}

export type VehicleDirectory = Awaited<ReturnType<typeof getVehicleDirectory>>;
