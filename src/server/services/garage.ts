import "server-only";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { db } from "@/server/db";
import { normalize } from "@/lib/normalize";
import type { vehicleSchema } from "@/lib/validators";
import { VinService } from "@/server/vin/service";

type VehicleInput = z.infer<typeof vehicleSchema>;

export const garageInclude = {
  make: true,
  series: true,
  engineCode: true,
  oeNumbers: { orderBy: { createdAt: "desc" as const }, include: { addedBy: { select: { name: true } } } },
  _count: { select: { orders: true, vinRequests: true } },
} satisfies Prisma.VehicleInclude;

export async function listVehicles(userId: string) {
  return db.vehicle.findMany({ where: { userId }, include: garageInclude, orderBy: { createdAt: "asc" } });
}

export async function getVehicle(userId: string, id: string) {
  return db.vehicle.findFirst({ where: { id, userId }, include: garageInclude });
}

/** Звіряємо посилання на довідники, щоб серія належала марці, а двигун — серії. */
async function sanitizeRefs(input: VehicleInput) {
  let { makeId, seriesId, engineCodeId } = input;
  if (makeId && !(await db.vehicleMake.findUnique({ where: { id: makeId } }))) makeId = undefined;
  if (seriesId) {
    const s = await db.vehicleSeries.findUnique({ where: { id: seriesId } });
    if (!s || s.makeId !== makeId) seriesId = undefined;
  }
  if (engineCodeId) {
    const e = await db.engineCode.findUnique({ where: { id: engineCodeId } });
    if (!e || !seriesId || e.seriesId !== seriesId) engineCodeId = undefined;
  }
  return { makeId, seriesId, engineCodeId };
}

async function buildData(input: VehicleInput) {
  const refs = await sanitizeRefs(input);
  const vin = input.vin ? normalize(input.vin) : undefined;
  const decoded = vin && vin.length === 17 ? await VinService.decode(vin) : null;
  const chassis = input.chassisNumber ? normalize(input.chassisNumber) : decoded?.serial;
  return {
    kind: input.kind,
    nickname: input.nickname ?? null,
    vin: vin ?? null,
    chassisNumber: chassis ?? null,
    ...refs,
    makeId: refs.makeId ?? null,
    seriesId: refs.seriesId ?? null,
    engineCodeId: refs.engineCodeId ?? null,
    year: input.year ?? null,
    euroClass: input.euroClass ?? null,
    gearbox: input.gearbox ?? null,
    axleConfig: input.axleConfig ?? null,
    cabType: input.cabType ?? null,
    axleBrand: input.kind === "TRAILER" ? (input.axleBrand ?? null) : null,
    plate: input.plate?.toUpperCase() ?? null,
    mileageKm: input.mileageKm ?? null,
    lastServiceKm: input.lastServiceKm ?? null,
    decodedJson: decoded ? (JSON.parse(JSON.stringify(decoded)) as Prisma.InputJsonValue) : undefined,
  };
}

export async function createVehicle(userId: string, input: VehicleInput) {
  return db.vehicle.create({ data: { userId, ...(await buildData(input)) } });
}

export async function updateVehicle(userId: string, id: string, input: VehicleInput) {
  const v = await db.vehicle.findFirst({ where: { id, userId } });
  if (!v) throw new Error("Авто не знайдено");
  return db.vehicle.update({ where: { id }, data: await buildData(input) });
}

export async function deleteVehicle(userId: string, id: string) {
  const v = await db.vehicle.findFirst({ where: { id, userId } });
  if (!v) throw new Error("Авто не знайдено");
  await db.vehicle.delete({ where: { id } });
}

export async function updateMileage(userId: string, id: string, mileageKm: number) {
  const v = await db.vehicle.findFirst({ where: { id, userId } });
  if (!v) throw new Error("Авто не знайдено");
  await db.vehicle.update({ where: { id }, data: { mileageKm } });
}

export const DEFAULT_SERVICE_INTERVAL = 100_000;

/** Нагадування про ТО: скільки лишилось до наступного обслуговування. */
export function serviceStatus(v: { mileageKm: number | null; lastServiceKm: number | null }, intervalKm = DEFAULT_SERVICE_INTERVAL) {
  if (v.mileageKm == null || v.lastServiceKm == null) return null;
  const next = v.lastServiceKm + intervalKm;
  const left = next - v.mileageKm;
  const done = Math.min(1, Math.max(0, (v.mileageKm - v.lastServiceKm) / intervalKm));
  return { next, left, done, intervalKm, due: left <= 10_000 };
}

/** Комплекти ТО, що підходять до авто (за двигуном → серією → маркою). */
export async function kitsForVehicle(v: { makeId: string | null; seriesId: string | null; engineCodeId: string | null }) {
  if (!v.makeId) return [];
  const kits = await db.serviceKit.findMany({
    where: { isActive: true, makeId: v.makeId },
    include: { series: true, engineCode: true, items: { include: { product: { select: { price: true } } } } },
  });
  return kits.filter(
    (k) => (!k.seriesId || k.seriesId === v.seriesId) && (!k.engineCodeId || k.engineCodeId === v.engineCodeId),
  );
}
