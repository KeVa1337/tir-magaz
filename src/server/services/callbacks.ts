import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { formatPrice } from "@/lib/format";
import { logAudit } from "./audit";
import { sendEmail } from "./notify";
import { getSettings } from "./settings";

export const cleanPhone = (p: string) => p.replace(/[^\d+]/g, "");

/** «Передзвоніть мені» */
export async function createCallback(input: { name?: string; phone: string; comment?: string; productId?: string }) {
  const req = await db.callbackRequest.create({
    data: { name: input.name || null, phone: cleanPhone(input.phone), comment: input.comment || null, productId: input.productId || null },
  });
  const { notifications } = await getSettings();
  await sendEmail(notifications.orderEmail, "Заявка на дзвінок", `${input.name ?? ""} ${input.phone}\n${input.comment ?? ""}`);
  return req;
}

/** «Купити в 1 клік»: замовлення лише з телефоном, деталі доставки менеджер уточнює дзвінком. */
export async function quickOrder(input: { productId: string; qty: number; name?: string; phone: string; userId: string | null }) {
  const p = await db.product.findFirst({
    where: { id: input.productId, isActive: true },
    include: { brand: { select: { name: true } }, offers: { orderBy: [{ leadDays: "asc" }, { price: "asc" }], take: 1 } },
  });
  if (!p) throw new Error("Товар недоступний");
  const ownAvailable = p.stockStatus === "IN_STOCK" || p.stockStatus === "LOW";
  const offer = !ownAvailable ? p.offers[0] : undefined;
  if (!ownAvailable && !offer && p.stockStatus === "OUT_OF_STOCK") throw new Error("Товару немає в наявності");
  const price = offer ? offer.price : p.price;
  const qty = Math.max(1, Math.min(99, Math.round(input.qty)));
  const order = await db.order.create({
    data: {
      userId: input.userId,
      contactName: input.name || "Швидке замовлення",
      contactPhone: cleanPhone(input.phone),
      deliveryMethod: "phone",
      paymentMethod: "cash",
      comment: "Купити в 1 клік — уточнити доставку й оплату телефоном",
      total: price.mul(qty),
      items: {
        create: [{
          productId: p.id, name: p.name, article: p.article, brandName: p.brand.name, price, qty,
          warehouse: offer ? `${offer.warehouse} · ${offer.city ?? ""}`.trim() : "Власний склад · Київ", leadDays: offer?.leadDays ?? null,
        }],
      },
      history: { create: [{ status: "NEW", byUserId: input.userId, comment: "Швидке замовлення в 1 клік" }] },
    },
  });
  await db.callbackRequest.create({
    data: { name: input.name || null, phone: cleanPhone(input.phone), kind: "quick-order", productId: p.id, orderId: order.id, comment: `Швидке замовлення №${order.number}: ${qty} шт.` },
  });
  const { notifications } = await getSettings();
  await sendEmail(notifications.orderEmail, `Швидке замовлення №${order.number}`, `${p.name} × ${qty} = ${formatPrice(new Prisma.Decimal(price).mul(qty))}, тел. ${input.phone}`);
  return order;
}

export async function adminListCallbacks(status?: "NEW" | "DONE") {
  return db.callbackRequest.findMany({
    where: status ? { status } : {},
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { product: { select: { name: true, slug: true, article: true } } },
    take: 200,
  });
}

export async function adminSetCallbackStatus(id: string, status: "NEW" | "DONE", byUserId: string) {
  await db.callbackRequest.update({ where: { id }, data: { status } });
  await logAudit(byUserId, "status", "CallbackRequest", id, { status });
}
