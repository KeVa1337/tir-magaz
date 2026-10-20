import "server-only";
import bcrypt from "bcryptjs";
import type { Prisma, Role } from "@prisma/client";
import { db } from "@/server/db";
import { logAudit, diffOf } from "./audit";

export async function registerUser(input: { name: string; email: string; phone?: string; password: string }) {
  const email = input.email.toLowerCase().trim();
  if (await db.user.findUnique({ where: { email } })) throw new Error("Користувач з таким email вже існує");
  const phone = input.phone ? input.phone.replace(/[^\d+]/g, "") : null;
  if (phone && (await db.user.findUnique({ where: { phone } }))) throw new Error("Цей телефон вже зареєстровано");
  return db.user.create({ data: { name: input.name, email, phone, passwordHash: await bcrypt.hash(input.password, 10) } });
}

export async function getProfile(userId: string) {
  return db.user.findUniqueOrThrow({ where: { id: userId }, include: { addresses: { orderBy: { isDefault: "desc" } } } });
}

export async function updateProfile(userId: string, data: { name: string; phone?: string }) {
  const phone = data.phone ? data.phone.replace(/[^\d+]/g, "") : null;
  if (phone) {
    const other = await db.user.findFirst({ where: { phone, id: { not: userId } } });
    if (other) throw new Error("Цей телефон вже використовується");
  }
  await db.user.update({ where: { id: userId }, data: { name: data.name, phone } });
}

export async function changePassword(userId: string, current: string, next: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.passwordHash || !(await bcrypt.compare(current, user.passwordHash))) throw new Error("Поточний пароль невірний");
  await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(next, 10) } });
}

export async function saveAddress(userId: string, data: { id?: string; label?: string; city: string; branch?: string; street?: string; isDefault: boolean }) {
  if (data.isDefault) await db.address.updateMany({ where: { userId }, data: { isDefault: false } });
  if (data.id) {
    await db.address.updateMany({ where: { id: data.id, userId }, data: { label: data.label, city: data.city, branch: data.branch, street: data.street, isDefault: data.isDefault } });
  } else {
    await db.address.create({ data: { userId, label: data.label, city: data.city, branch: data.branch, street: data.street, isDefault: data.isDefault } });
  }
}

export async function deleteAddress(userId: string, id: string) {
  await db.address.deleteMany({ where: { id, userId } });
}

// ───────────── адмінка: клієнти і співробітники ─────────────

export async function adminListCustomers(q?: string, page = 1) {
  const perPage = 30;
  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q.replace(/\s/g, "") } }, { vehicles: { some: { OR: [{ vin: { contains: q.toUpperCase() } }, { plate: { contains: q.toUpperCase() } }] } } }] } : {}),
  };
  const [items, total] = await Promise.all([
    db.user.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * perPage, take: perPage,
      include: { _count: { select: { vehicles: true, orders: true, vinRequests: true } }, orders: { select: { total: true }, where: { status: { notIn: ["CANCELLED", "RETURNED"] } } } },
    }),
    db.user.count({ where }),
  ]);
  return { items, total, perPage, page };
}

export async function adminGetCustomer(id: string) {
  return db.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      vehicles: { include: { make: true, series: true, engineCode: true, oeNumbers: true } },
      orders: { orderBy: { createdAt: "desc" }, include: { items: { select: { qty: true } } } },
      vinRequests: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function adminSetCustomerNote(id: string, note: string, byUserId: string) {
  await db.user.update({ where: { id }, data: { managerNote: note || null } });
  await logAudit(byUserId, "note", "User", id);
}

export async function adminListStaff() {
  return db.user.findMany({ where: { role: { in: ["MANAGER", "ADMIN"] } }, orderBy: [{ role: "desc" }, { name: "asc" }] });
}

export async function adminCreateStaff(data: { name: string; email: string; role: Role; password: string }, byUserId: string) {
  const email = data.email.toLowerCase().trim();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({ where: { id: existing.id }, data: { role: data.role } });
    await logAudit(byUserId, "role", "User", existing.id, { from: existing.role, to: data.role });
    return existing;
  }
  const user = await db.user.create({ data: { name: data.name, email, role: data.role, passwordHash: await bcrypt.hash(data.password, 10) } });
  await logAudit(byUserId, "create", "User", user.id, { email, role: data.role });
  return user;
}

export async function adminUpdateUser(id: string, data: { role?: Role; isActive?: boolean }, byUserId: string) {
  if (id === byUserId && (data.role && data.role !== "ADMIN" || data.isActive === false)) throw new Error("Не можна знизити права або вимкнути себе");
  const before = await db.user.findUniqueOrThrow({ where: { id } });
  await db.user.update({ where: { id }, data });
  await logAudit(byUserId, "update", "User", id, diffOf(before, data));
}
