import "server-only";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export * from "./fitment-rules";
import type { VehicleContext } from "./fitment-rules";

export const VEHICLE_CTX_COOKIE = "tir_ctx";

/** Prisma-фільтр «тільки для мого авто»: кандидати (точні + «уточнити»); номер шасі перевіряється вже в evaluateFit. */
export function whereForVehicle(ctx: VehicleContext): Prisma.ProductWhereInput {
  const rule: Prisma.FitmentWhereInput[] = [];
  const target: Prisma.FitmentWhereInput[] = [];
  if (ctx.makeId) target.push({ makeId: ctx.makeId });
  if (ctx.axleBrand) target.push({ makeId: null, axleBrand: { equals: ctx.axleBrand, mode: "insensitive" } });
  else if (ctx.kind === "TRAILER") target.push({ makeId: null, axleBrand: { not: null } });
  if (!target.length) return { id: "__none__" };
  rule.push({ OR: target });
  if (ctx.seriesId) rule.push({ OR: [{ seriesId: null }, { seriesId: ctx.seriesId }] });
  if (ctx.engineCodeId) rule.push({ OR: [{ engineCodeId: null }, { engineCodeId: ctx.engineCodeId }] });
  if (ctx.year) {
    rule.push({ OR: [{ yearFrom: null }, { yearFrom: { lte: ctx.year } }] });
    rule.push({ OR: [{ yearTo: null }, { yearTo: { gte: ctx.year } }] });
  }
  const or: Prisma.ProductWhereInput[] = [{ isUniversal: true }, { fitments: { some: { AND: rule } } }];
  if (ctx.oeNumbers.length) {
    or.push({ articleNorm: { in: ctx.oeNumbers } }, { numbers: { some: { numberNorm: { in: ctx.oeNumbers } } } });
  }
  return { OR: or };
}

export const fitmentSelect = {
  makeId: true, seriesId: true, engineCodeId: true, axleBrand: true, yearFrom: true, yearTo: true,
  chassisFrom: true, chassisTo: true, position: true, note: true,
} satisfies Prisma.FitmentSelect;

const vehicleInclude = {
  make: { select: { name: true } },
  series: { select: { name: true } },
  engineCode: { select: { code: true } },
  oeNumbers: { select: { oeNumber: true } },
} satisfies Prisma.VehicleInclude;

type VehicleWithRefs = Prisma.VehicleGetPayload<{ include: typeof vehicleInclude }>;

export function vehicleTitle(v: { make?: { name: string } | null; series?: { name: string } | null; engineCode?: { code: string } | null }) {
  return [v.make?.name, v.series?.name, v.engineCode?.code].filter(Boolean).join(" ") || "Авто без моделі";
}

export function contextFromVehicle(v: VehicleWithRefs): VehicleContext {
  const title = vehicleTitle(v);
  return {
    source: "garage",
    vehicleId: v.id,
    label: v.nickname ? `${v.nickname} · ${title}` : title,
    shortLabel: [v.make?.name, v.series?.name].filter(Boolean).join(" ") || title,
    kind: v.kind,
    makeId: v.makeId ?? undefined,
    seriesId: v.seriesId ?? undefined,
    engineCodeId: v.engineCodeId ?? undefined,
    year: v.year ?? undefined,
    chassis: v.chassisNumber ?? (v.vin && v.vin.length === 17 ? v.vin.slice(11) : undefined),
    axleBrand: v.axleBrand ?? undefined,
    oeNumbers: v.oeNumbers.map((o) => o.oeNumber),
  };
}

export async function contextForVehicleId(vehicleId: string, userId: string): Promise<VehicleContext | null> {
  const v = await db.vehicle.findFirst({ where: { id: vehicleId, userId }, include: vehicleInclude });
  return v ? contextFromVehicle(v) : null;
}

/** Швидкий вибір без гаража: q:<makeId>:<seriesId>:<engineId>:<year> */
export async function contextFromQuick(raw: string): Promise<VehicleContext | null> {
  const [, makeId, seriesId, engineCodeId, year] = raw.split(":");
  if (!makeId) return null;
  const [make, series, engine] = await Promise.all([
    db.vehicleMake.findUnique({ where: { id: makeId }, select: { name: true, kind: true } }),
    seriesId ? db.vehicleSeries.findUnique({ where: { id: seriesId }, select: { name: true, makeId: true } }) : null,
    engineCodeId ? db.engineCode.findUnique({ where: { id: engineCodeId }, select: { code: true } }) : null,
  ]);
  if (!make) return null;
  const validSeries = series && series.makeId === makeId ? series : null;
  const title = [make.name, validSeries?.name, engine?.code].filter(Boolean).join(" ");
  return {
    source: "quick",
    label: title + (year ? `, ${year}` : ""),
    shortLabel: [make.name, validSeries?.name].filter(Boolean).join(" "),
    kind: make.kind,
    makeId,
    seriesId: validSeries ? seriesId : undefined,
    engineCodeId: validSeries && engine ? engineCodeId : undefined,
    year: year ? Number(year) : undefined,
    oeNumbers: [],
  };
}

/** Поточний контекст підбору з cookie (для серверних компонентів). */
export async function getVehicleContext(userId: string | null | undefined): Promise<VehicleContext | null> {
  const raw = (await cookies()).get(VEHICLE_CTX_COOKIE)?.value;
  if (!raw) return null;
  if (raw.startsWith("v:")) return userId ? contextForVehicleId(raw.slice(2), userId) : null;
  if (raw.startsWith("q:")) return contextFromQuick(raw);
  return null;
}

export async function listGarageOptions(userId: string) {
  const vehicles = await db.vehicle.findMany({ where: { userId }, include: vehicleInclude, orderBy: { createdAt: "asc" } });
  return vehicles.map((v) => ({ id: v.id, kind: v.kind, label: contextFromVehicle(v).label, plate: v.plate }));
}
