import "server-only";
import { Prisma, type OrderStatus } from "@prisma/client";
import { db } from "@/server/db";
import { formatPrice } from "@/lib/format";
import { deliveryLabel, ORDER_STATUS, paymentLabel } from "@/lib/labels";
import type { checkoutSchema } from "@/lib/validators";
import type { z } from "zod";
import { logAudit, diffOf } from "./audit";
import { getCartView, clearCart } from "./cart";
import { sendEmail } from "./notify";
import { getSettings } from "./settings";

type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Оформлення замовлення з кошика (SPEC §7.4). Оплата в демо не проводиться — статус NEW. */
export async function placeOrder(userId: string | null, input: CheckoutInput) {
  const cart = await getCartView(userId);
  if (!cart.items.length) throw new Error("Кошик порожній");

  let vehicleId: string | null = null;
  if (input.vehicleId && userId) {
    const v = await db.vehicle.findFirst({ where: { id: input.vehicleId, userId } });
    if (v) {
      vehicleId = v.id;
      if (input.mileageKm && (!v.mileageKm || input.mileageKm > v.mileageKm))
        await db.vehicle.update({ where: { id: v.id }, data: { mileageKm: input.mileageKm } });
    }
  }

  const products = await db.product.findMany({
    where: { id: { in: cart.items.map((i) => i.product.id) }, isActive: true },
    include: { brand: { select: { name: true } } },
  });
  const items = cart.items
    .map((ci) => {
      const p = products.find((x) => x.id === ci.product.id);
      return p ? { productId: p.id, name: p.name, article: p.article, brandName: p.brand.name, price: p.price, qty: ci.qty } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  if (!items.length) throw new Error("Товари з кошика недоступні");
  const total = items.reduce((s, i) => s.add(i.price.mul(i.qty)), new Prisma.Decimal(0));

  const order = await db.order.create({
    data: {
      userId,
      vehicleId,
      mileageKm: vehicleId ? input.mileageKm : null,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail || null,
      deliveryMethod: input.deliveryMethod,
      deliveryCity: input.deliveryCity,
      deliveryBranch: input.deliveryBranch,
      deliveryAddress: input.deliveryAddress,
      paymentMethod: input.paymentMethod,
      comment: input.comment,
      total,
      items: { create: items },
      history: { create: [{ status: "NEW", byUserId: userId, comment: "Замовлення оформлено на сайті" }] },
    },
  });
  await clearCart(userId);

  const settings = await getSettings();
  const summary = `Замовлення №${order.number} на ${formatPrice(total)}. ${deliveryLabel(order.deliveryMethod)}, ${paymentLabel(order.paymentMethod)}.`;
  await sendEmail(settings.notifications.orderEmail, `Нове замовлення №${order.number}`, summary);
  if (settings.notifications.sendCustomerEmails) await sendEmail(order.contactEmail, `Ваше замовлення №${order.number} прийнято`, summary);
  return order;
}

const orderInclude = {
  items: { include: { product: { select: { slug: true, isActive: true } } }, orderBy: { id: "asc" as const } },
  history: { orderBy: { createdAt: "asc" as const }, include: { byUser: { select: { name: true, role: true } } } },
  vehicle: { include: { make: true, series: true, engineCode: true } },
  user: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.OrderInclude;

export async function listUserOrders(userId: string, take?: number) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    include: { items: { select: { qty: true } }, vehicle: { select: { nickname: true, plate: true } } },
  });
}

export async function getUserOrder(userId: string, number: number) {
  return db.order.findFirst({ where: { userId, number }, include: orderInclude });
}

/** Історія покупок по конкретному авто. */
export async function getVehiclePurchaseHistory(vehicleId: string) {
  return db.order.findMany({
    where: { vehicleId, status: { notIn: ["CANCELLED"] } },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: { select: { slug: true } } } } },
  });
}

// ───────────── адмінка ─────────────

export interface AdminOrderFilters {
  status?: OrderStatus;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
}

export async function adminListOrders(f: AdminOrderFilters) {
  const perPage = 30;
  const page = Math.max(1, f.page ?? 1);
  const and: Prisma.OrderWhereInput[] = [];
  if (f.status) and.push({ status: f.status });
  if (f.q) {
    const n = Number(f.q.replace(/\D/g, ""));
    and.push({
      OR: [
        ...(n && f.q.replace(/\D/g, "").length <= 6 ? [{ number: n }] : []),
        { contactName: { contains: f.q, mode: "insensitive" } },
        { contactPhone: { contains: f.q.replace(/\s/g, "") } },
        { contactEmail: { contains: f.q, mode: "insensitive" } },
      ],
    });
  }
  if (f.from) and.push({ createdAt: { gte: new Date(f.from) } });
  if (f.to) and.push({ createdAt: { lte: new Date(new Date(f.to).getTime() + 86400000) } });
  const where: Prisma.OrderWhereInput = { AND: and };
  const [items, total, counts] = await Promise.all([
    db.order.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * perPage, take: perPage,
      include: { items: { select: { qty: true } }, user: { select: { name: true } } },
    }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  return { items, total, page, perPage, counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Partial<Record<OrderStatus, number>> };
}

export async function adminGetOrder(id: string) {
  return db.order.findUnique({ where: { id }, include: orderInclude });
}

export async function adminSetOrderStatus(id: string, status: OrderStatus, comment: string | undefined, byUserId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  if (order.status === status && !comment) return order;
  const updated = await db.order.update({
    where: { id },
    data: { status, history: { create: { status, comment, byUserId } } },
  });
  await logAudit(byUserId, "status", "Order", id, { from: order.status, to: status, comment: comment ?? null });
  await sendEmail(order.contactEmail, `Замовлення №${order.number}: ${ORDER_STATUS[status].label}`, comment ?? "");
  return updated;
}

export async function adminUpdateOrderMeta(id: string, data: { managerComment?: string | null; contactName?: string; contactPhone?: string; deliveryCity?: string | null; deliveryBranch?: string | null }, byUserId: string) {
  const before = await db.order.findUniqueOrThrow({ where: { id } });
  await db.order.update({ where: { id }, data });
  await logAudit(byUserId, "update", "Order", id, diffOf(before, data));
}

async function recalcTotal(orderId: string) {
  const items = await db.orderItem.findMany({ where: { orderId } });
  const total = items.reduce((s, i) => s.add(i.price.mul(i.qty)), new Prisma.Decimal(0));
  await db.order.update({ where: { id: orderId }, data: { total } });
}

export async function adminUpdateOrderItem(orderId: string, itemId: string, qty: number, price: number, byUserId: string) {
  const item = await db.orderItem.findFirstOrThrow({ where: { id: itemId, orderId } });
  if (qty <= 0) await db.orderItem.delete({ where: { id: itemId } });
  else await db.orderItem.update({ where: { id: itemId }, data: { qty, price: new Prisma.Decimal(price) } });
  await recalcTotal(orderId);
  await logAudit(byUserId, qty <= 0 ? "remove-item" : "update-item", "Order", orderId, {
    item: item.article, qty: { from: item.qty, to: qty }, price: { from: item.price.toString(), to: price },
  });
}

export async function adminAddOrderItem(orderId: string, productId: string, qty: number, byUserId: string) {
  const p = await db.product.findUniqueOrThrow({ where: { id: productId }, include: { brand: true } });
  const existing = await db.orderItem.findFirst({ where: { orderId, productId } });
  if (existing) await db.orderItem.update({ where: { id: existing.id }, data: { qty: existing.qty + qty } });
  else await db.orderItem.create({ data: { orderId, productId, name: p.name, article: p.article, brandName: p.brand.name, price: p.price, qty } });
  await recalcTotal(orderId);
  await logAudit(byUserId, "add-item", "Order", orderId, { article: p.article, qty });
}
