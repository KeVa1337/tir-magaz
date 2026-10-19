import type { ProductFilters, SortKey } from "@/server/services/catalog";

export type SP = Record<string, string | string[] | undefined>;

export function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
export function all(v: string | string[] | undefined): string[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}

const SORTS: SortKey[] = ["popular", "price_asc", "price_desc", "new", "name"];

export function parseFilters(sp: SP): ProductFilters {
  const num = (k: string) => {
    const v = Number(first(sp[k]));
    return Number.isFinite(v) && v > 0 ? v : undefined;
  };
  const attrs: Record<string, string[]> = {};
  for (const raw of all(sp.a)) {
    const i = raw.indexOf(":");
    if (i > 0) (attrs[raw.slice(0, i)] ??= []).push(raw.slice(i + 1));
  }
  const sort = first(sp.sort) as SortKey | undefined;
  return {
    brandSlugs: (first(sp.brand) ?? "").split(",").filter(Boolean),
    makeSlug: first(sp.make) || undefined,
    inStock: first(sp.stock) === "1",
    priceMin: num("pmin"),
    priceMax: num("pmax"),
    attrs,
    onlyFit: first(sp.fit) === "1",
    sort: sort && SORTS.includes(sort) ? sort : "popular",
    page: num("page") ?? 1,
  };
}

export function toQuery(sp: SP, patch: Record<string, string | string[] | null>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) for (const x of all(v)) params.append(k, x);
  for (const [k, v] of Object.entries(patch)) {
    params.delete(k);
    if (v == null) continue;
    for (const x of Array.isArray(v) ? v : [v]) if (x !== "") params.append(k, x);
  }
  if (!("page" in patch)) params.delete("page");
  const s = params.toString();
  return s ? `?${s}` : "";
}
