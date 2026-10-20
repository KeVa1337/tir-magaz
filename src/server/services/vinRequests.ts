import "server-only";
import type { Prisma, VinRequestStatus } from "@prisma/client";
import { db } from "@/server/db";
import { normalize } from "@/lib/normalize";
import { logAudit } from "./audit";
import { sendEmail } from "./notify";
import { getSettings } from "./settings";

const detailInclude = {
  vehicle: { include: { make: true, series: true, engineCode: true, oeNumbers: { orderBy: { createdAt: "desc" as const } } } },
  user: { select: { id: true, name: true, email: true, phone: true } },
  assignedTo: { select: { id: true, name: true } },
  messages: { orderBy: { createdAt: "asc" as const }, include: { author: { select: { name: true, role: true } } } },
  items: {
    orderBy: { id: "asc" as const },
    include: {
      product: {
        select: {
          id: true, slug: true, name: true, article: true, articleNorm: true, price: true, stockStatus: true, leadTimeDays: true, isActive: true,
          brand: { select: { name: true, isOriginal: true } }, numbers: { select: { number: true, numberNorm: true, type: true, brandName: true } },
        },
      },
    },
  },
} satisfies Prisma.VinRequestInclude;

export type VinRequestDetail = Prisma.VinRequestGetPayload<{ include: typeof detailInclude }>;

export async function createVinRequest(input: {
  userId: string | null; vehicleId?: string; vin?: string; guestName?: string; guestPhone?: string; message: string; attachments: string[];
}) {
  let vehicleId: string | null = null;
  let vin = input.vin ? normalize(input.vin) : null;
  if (input.userId && input.vehicleId) {
    const v = await db.vehicle.findFirst({ where: { id: input.vehicleId, userId: input.userId } });
    if (v) {
      vehicleId = v.id;
      vin = vin ?? v.vin;
    }
  }
  if (!input.userId && !input.guestPhone) throw new Error("Вкажіть телефон для зв'язку");
  if (!vehicleId && !vin) throw new Error("Вкажіть VIN або оберіть авто з гаража");

  const req = await db.vinRequest.create({
    data: {
      userId: input.userId, vehicleId, vin, guestName: input.guestName, guestPhone: input.guestPhone, message: input.message,
      messages: { create: { authorId: input.userId, text: input.message, attachments: input.attachments } },
    },
  });
  const settings = await getSettings();
  await sendEmail(settings.vin.notifyEmail, `Новий VIN-запит №${req.number}`, `${vin ?? ""}\n${input.message}`);
  return req;
}

export async function listUserVinRequests(userId: string) {
  return db.vinRequest.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { vehicle: { include: { make: true, series: true } }, _count: { select: { items: true, messages: true } } },
  });
}

export async function getUserVinRequest(userId: string, number: number) {
  return db.vinRequest.findFirst({ where: { userId, number }, include: detailInclude });
}

export async function addCustomerMessage(userId: string, requestId: string, text: string, attachments: string[]) {
  const req = await db.vinRequest.findFirst({ where: { id: requestId, userId } });
  if (!req) throw new Error("Запит не знайдено");
  await db.vinRequestMessage.create({ data: { requestId, authorId: userId, text, attachments } });
  // нове питання клієнта повертає запит у роботу
  await db.vinRequest.update({ where: { id: requestId }, data: { status: req.status === "CLOSED" || req.status === "ANSWERED" ? "IN_PROGRESS" : req.status } });
}

export async function closeVinRequestByCustomer(userId: string, requestId: string) {
  const req = await db.vinRequest.findFirst({ where: { id: requestId, userId } });
  if (!req) throw new Error("Запит не знайдено");
  await db.vinRequest.update({ where: { id: requestId }, data: { status: "CLOSED" } });
}

// ───────────── адмінка ─────────────

export async function adminListVinRequests(f: { status?: VinRequestStatus; mine?: string; q?: string }) {
  const where: Prisma.VinRequestWhereInput = {
    ...(f.status ? { status: f.status } : { status: { in: ["NEW", "IN_PROGRESS"] } }),
    ...(f.mine ? { assignedToId: f.mine } : {}),
    ...(f.q
      ? { OR: [{ vin: { contains: normalize(f.q) } }, { message: { contains: f.q, mode: "insensitive" } }, { guestPhone: { contains: f.q } }, { user: { name: { contains: f.q, mode: "insensitive" } } }] }
      : {}),
  };
  const [items, counts] = await Promise.all([
    db.vinRequest.findMany({
      where,
      orderBy: [{ createdAt: "asc" }],
      include: {
        user: { select: { name: true, phone: true } },
        vehicle: { include: { make: true, series: true } },
        assignedTo: { select: { name: true } },
        _count: { select: { items: true, messages: true } },
      },
      take: 200,
    }),
    db.vinRequest.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  return { items, counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Partial<Record<VinRequestStatus, number>> };
}

export async function adminGetVinRequest(id: string) {
  return db.vinRequest.findUnique({ where: { id }, include: detailInclude });
}

export async function adminAssign(id: string, managerId: string) {
  const req = await db.vinRequest.findUniqueOrThrow({ where: { id } });
  await db.vinRequest.update({ where: { id }, data: { assignedToId: managerId, status: req.status === "NEW" ? "IN_PROGRESS" : req.status } });
  await logAudit(managerId, "assign", "VinRequest", id);
}

export async function adminAddItem(id: string, productId: string, qty: number, comment: string | undefined, byUserId: string) {
  const existing = await db.vinRequestItem.findFirst({ where: { requestId: id, productId } });
  if (existing) await db.vinRequestItem.update({ where: { id: existing.id }, data: { qty, comment } });
  else await db.vinRequestItem.create({ data: { requestId: id, productId, qty, comment } });
  const req = await db.vinRequest.findUniqueOrThrow({ where: { id } });
  if (req.status === "NEW") await db.vinRequest.update({ where: { id }, data: { status: "IN_PROGRESS", assignedToId: req.assignedToId ?? byUserId } });
  await logAudit(byUserId, "add-item", "VinRequest", id, { productId, qty });
}

export async function adminRemoveItem(id: string, itemId: string, byUserId: string) {
  await db.vinRequestItem.deleteMany({ where: { id: itemId, requestId: id } });
  await logAudit(byUserId, "remove-item", "VinRequest", id, { itemId });
}

/** Відповідь менеджера: повідомлення + статус ANSWERED + сповіщення клієнта. */
export async function adminAnswer(id: string, text: string, byUserId: string) {
  const req = await db.vinRequest.findUniqueOrThrow({ where: { id }, include: { user: true, _count: { select: { items: true } } } });
  if (text) await db.vinRequestMessage.create({ data: { requestId: id, authorId: byUserId, isStaff: true, text, attachments: [] } });
  await db.vinRequest.update({
    where: { id },
    data: { status: "ANSWERED", answeredAt: req.answeredAt ?? new Date(), assignedToId: req.assignedToId ?? byUserId },
  });
  await logAudit(byUserId, "answer", "VinRequest", id, { items: req._count.items });
  await sendEmail(req.user?.email, `Відповідь на VIN-запит №${req.number}`, text || "Менеджер підібрав деталі — перегляньте в кабінеті.");
}

export async function adminMessage(id: string, text: string, byUserId: string) {
  await db.vinRequestMessage.create({ data: { requestId: id, authorId: byUserId, isStaff: true, text, attachments: [] } });
  const req = await db.vinRequest.findUniqueOrThrow({ where: { id } });
  if (req.status === "NEW") await db.vinRequest.update({ where: { id }, data: { status: "IN_PROGRESS", assignedToId: req.assignedToId ?? byUserId } });
}

export async function adminSetStatus(id: string, status: VinRequestStatus, byUserId: string) {
  await db.vinRequest.update({ where: { id }, data: { status } });
  await logAudit(byUserId, "status", "VinRequest", id, { status });
}

/** Прив'язка OE-номера до авто клієнта — наповнення власної бази «VIN → OE». */
export async function adminLinkOe(vehicleId: string, number: string, label: string | undefined, byUserId: string) {
  const oeNumber = normalize(number);
  if (!oeNumber) throw new Error("Порожній номер");
  await db.vehicleOeNumber.upsert({
    where: { vehicleId_oeNumber: { vehicleId, oeNumber } },
    create: { vehicleId, oeNumber, label, addedById: byUserId },
    update: { label },
  });
  await logAudit(byUserId, "link-oe", "Vehicle", vehicleId, { oeNumber, label: label ?? null });
}

export async function adminUnlinkOe(oeId: string, byUserId: string) {
  const oe = await db.vehicleOeNumber.delete({ where: { id: oeId } });
  await logAudit(byUserId, "unlink-oe", "Vehicle", oe.vehicleId, { oeNumber: oe.oeNumber });
}
