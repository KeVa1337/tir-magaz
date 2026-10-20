/**
 * Чисті правила підбору (SPEC §7.2) — без доступу до БД, щоб їх можна було тестувати.
 */
import type { VehicleKind } from "@prisma/client";
import { normalize } from "@/lib/normalize";

/** Контекст підбору — «Моє авто» в шапці (з гаража або швидкий вибір марки/серії). */
export interface VehicleContext {
  source: "garage" | "quick";
  vehicleId?: string;
  label: string;
  shortLabel: string;
  kind?: VehicleKind;
  makeId?: string;
  seriesId?: string;
  engineCodeId?: string;
  year?: number;
  chassis?: string;
  axleBrand?: string;
  oeNumbers: string[];
}

export type FitStatus = "fits" | "maybe" | "no";
export interface FitResult {
  status: FitStatus;
  reason: string;
  position?: string | null;
  note?: string | null;
}

export interface FitmentLite {
  makeId: string | null;
  seriesId: string | null;
  engineCodeId: string | null;
  axleBrand: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  chassisFrom: string | null;
  chassisTo: string | null;
  position: string | null;
  note: string | null;
}

export interface FitProduct {
  articleNorm: string;
  isUniversal: boolean;
  numbers: { numberNorm: string }[];
  fitments: FitmentLite[];
}

/** Порівняння номерів шасі: числові — як числа, інакше — природне порівняння рядків. */
export function compareChassis(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (/^\d+$/.test(na) && /^\d+$/.test(nb)) return Number(na) - Number(nb);
  return na.localeCompare(nb, "en", { numeric: true });
}

type RuleMatch = { status: FitStatus; missing: string[] };

function matchRule(f: FitmentLite, ctx: VehicleContext): RuleMatch {
  const missing: string[] = [];
  if (f.makeId) {
    if (!ctx.makeId) missing.push("марка");
    else if (f.makeId !== ctx.makeId) return { status: "no", missing };
  }
  if (f.axleBrand) {
    if (!ctx.axleBrand) missing.push("марка осей");
    else if (f.axleBrand.toUpperCase() !== ctx.axleBrand.toUpperCase()) return { status: "no", missing };
  }
  if (f.seriesId) {
    if (!ctx.seriesId) missing.push("серія");
    else if (f.seriesId !== ctx.seriesId) return { status: "no", missing };
  }
  if (f.engineCodeId) {
    if (!ctx.engineCodeId) missing.push("двигун");
    else if (f.engineCodeId !== ctx.engineCodeId) return { status: "no", missing };
  }
  if (f.yearFrom != null || f.yearTo != null) {
    if (ctx.year == null) missing.push("рік");
    else if ((f.yearFrom != null && ctx.year < f.yearFrom) || (f.yearTo != null && ctx.year > f.yearTo))
      return { status: "no", missing };
  }
  if (f.chassisFrom || f.chassisTo) {
    if (!ctx.chassis) missing.push("номер шасі");
    else if (
      (f.chassisFrom && compareChassis(ctx.chassis, f.chassisFrom) < 0) ||
      (f.chassisTo && compareChassis(ctx.chassis, f.chassisTo) > 0)
    )
      return { status: "no", missing };
  }
  // збіг лише за маркою без уточнень — «уточніть у менеджера»
  const onlyMake = !!f.makeId && !f.seriesId && !f.engineCodeId && f.yearFrom == null && f.yearTo == null && !f.chassisFrom && !f.chassisTo && !f.axleBrand;
  if (onlyMake) missing.push("модель");
  return { status: missing.length ? "maybe" : "fits", missing };
}

/** Алгоритм підбору SPEC §7.2. */
export function evaluateFit(p: FitProduct, ctx: VehicleContext): FitResult {
  if (ctx.oeNumbers.length) {
    const oe = new Set(ctx.oeNumbers);
    if (oe.has(p.articleNorm) || p.numbers.some((n) => oe.has(n.numberNorm)))
      return { status: "fits", reason: "Збіг за OE-номером, прив'язаним до вашого авто" };
  }
  if (p.isUniversal) return { status: "fits", reason: "Універсальна позиція" };
  if (!p.fitments.length) return { status: "maybe", reason: "Немає даних про застосовність — уточніть у менеджера" };

  let maybe: { f: FitmentLite; missing: string[] } | null = null;
  for (const f of p.fitments) {
    const r = matchRule(f, ctx);
    if (r.status === "fits") return { status: "fits", reason: "Збіг за правилом застосовності", position: f.position, note: f.note };
    if (r.status === "maybe" && !maybe) maybe = { f, missing: r.missing };
  }
  if (maybe)
    return {
      status: "maybe",
      reason: `Уточніть у менеджера: не вистачає даних (${maybe.missing.join(", ")})`,
      position: maybe.f.position,
      note: maybe.f.note,
    };
  return { status: "no", reason: `Не підходить до ${ctx.shortLabel}` };
}

