import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { looksLikeVin, normalize } from "@/lib/normalize";
import { productCardSelect, sortByFit, toCard, type ProductCardDTO } from "./catalog";
import { getSettings } from "./settings";
import type { VehicleContext } from "./fitment";

export interface SearchHit extends ProductCardDTO {
  match: "article" | "oe" | "prefix" | "text";
  matchedNumber?: string;
  matchedBrand?: string | null;
}

export interface SearchResult {
  query: string;
  norm: string;
  vinCandidate: boolean;
  hits: SearchHit[];
  categories: { name: string; slug: string }[];
}

/** Грубий «стемінг» для української: обрізаємо закінчення, щоб «колодки» знаходило «колодка». */
function stem(term: string) {
  if (term.length >= 7) return term.slice(0, -2);
  if (term.length >= 5) return term.slice(0, -1);
  return term;
}

async function expandTerms(q: string): Promise<string[][]> {
  const { synonyms } = await getSettings();
  const terms = q.toLowerCase().split(/[\s,.;/]+/).filter((t) => t.length >= 2);
  return terms.map((t) => {
    const group = synonyms.find((g) => g.some((s) => stem(s) === stem(t) || s === t));
    const variants = group ? [t, ...group] : [t];
    return [...new Set(variants.map(stem))];
  });
}

/**
 * Пошук за SPEC §10:
 * 1) точний збіг артикулу; 2) точний збіг OE/крос-номера → «аналог для OE»;
 * 3) префіксний збіг номерів; 4) текстовий пошук за назвою з синонімами (pg_trgm як запасний варіант).
 */
export async function search(qRaw: string, ctx: VehicleContext | null, limit = 60): Promise<SearchResult> {
  const query = qRaw.trim().slice(0, 100);
  const norm = normalize(query);
  const result: SearchResult = { query, norm, vinCandidate: looksLikeVin(query), hits: [], categories: [] };
  if (!query) return result;

  const seen = new Set<string>();
  const push = (rows: Prisma.ProductGetPayload<{ select: typeof productCardSelect }>[], match: SearchHit["match"], extra?: (id: string) => Partial<SearchHit>) => {
    for (const r of rows) {
      if (seen.has(r.id) || result.hits.length >= limit) continue;
      seen.add(r.id);
      result.hits.push({ ...toCard(r, ctx), match, ...(extra?.(r.id) ?? {}) });
    }
  };

  if (norm.length >= 3) {
    // 1. артикул або внутрішній SKU
    const exact = await db.product.findMany({
      where: { isActive: true, OR: [{ articleNorm: norm }, { sku: { equals: query, mode: "insensitive" } }] },
      select: productCardSelect,
    });
    push(exact, "article");

    // 2. OE / крос
    const numberHits = await db.productNumber.findMany({
      where: { numberNorm: norm, product: { isActive: true } },
      select: { productId: true, number: true, brandName: true, type: true },
    });
    if (numberHits.length) {
      const rows = await db.product.findMany({ where: { id: { in: numberHits.map((n) => n.productId) } }, select: productCardSelect, orderBy: { stockStatus: "asc" } });
      const info = new Map(numberHits.map((n) => [n.productId, n]));
      push(rows, "oe", (id) => ({ matchedNumber: info.get(id)?.number, matchedBrand: info.get(id)?.brandName }));
    }

    // 3. префікс
    if (norm.length >= 4) {
      const prefix = await db.product.findMany({
        where: {
          isActive: true,
          OR: [{ articleNorm: { startsWith: norm } }, { numbers: { some: { numberNorm: { startsWith: norm } } } }],
        },
        select: productCardSelect,
        take: 30,
      });
      push(prefix, "prefix");
    }
  }

  // 4. текст: кожне слово (або його синонім) має зустрітись у назві / бренді / категорії
  const groups = await expandTerms(query);
  if (groups.length) {
    const conds = groups.map(
      (variants) =>
        Prisma.sql`(${Prisma.join(
          variants.map((v) => Prisma.sql`(p.name ILIKE ${"%" + v + "%"} OR b.name ILIKE ${"%" + v + "%"} OR c.name ILIKE ${"%" + v + "%"})`),
          " OR ",
        )})`,
    );
    let ids = await db.$queryRaw<{ id: string }[]>`
      SELECT p.id FROM "Product" p
      JOIN "PartBrand" b ON b.id = p."brandId"
      JOIN "Category" c ON c.id = p."categoryId"
      WHERE p."isActive" AND ${Prisma.join(conds, " AND ")}
      ORDER BY similarity(p.name, ${query}) DESC, p."stockStatus" ASC
      LIMIT ${limit}`;
    if (!ids.length && query.length >= 4) {
      // нечіткий пошук — опечатки
      ids = await db.$queryRaw<{ id: string }[]>`
        SELECT p.id FROM "Product" p
        WHERE p."isActive" AND word_similarity(${query}, p.name) > 0.35
        ORDER BY word_similarity(${query}, p.name) DESC LIMIT ${limit}`;
    }
    if (ids.length) {
      const rows = await db.product.findMany({ where: { id: { in: ids.map((i) => i.id) } }, select: productCardSelect });
      const order = new Map(ids.map((r, i) => [r.id, i]));
      rows.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
      push(rows, "text");
    }
    const catConds = groups.map((variants) => ({ OR: variants.map((v) => ({ name: { contains: v, mode: "insensitive" as const } })) }));
    result.categories = await db.category.findMany({ where: { isActive: true, AND: catConds }, select: { name: true, slug: true }, take: 5 });
  }
  if (ctx) result.hits = sortByFit(result.hits);
  return result;
}

export async function autocomplete(q: string, ctx: VehicleContext | null) {
  const res = await search(q, ctx, 8);
  return {
    vinCandidate: res.vinCandidate,
    norm: res.norm,
    categories: res.categories.slice(0, 4),
    products: res.hits.slice(0, 7).map((h) => ({
      slug: h.slug, name: h.name, article: h.article, brand: h.brand, price: h.price, match: h.match,
      matchedNumber: h.matchedNumber, stockStatus: h.stockStatus, fit: h.fit?.status ?? null,
    })),
  };
}
