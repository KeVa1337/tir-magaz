import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { db } from "@/server/db";
import { toNumber } from "@/lib/format";

export const CART_COOKIE = "tir_cart";
const MAX_QTY = 999;

const itemInclude = {
  product: {
    select: {
      id: true, slug: true, name: true, article: true, price: true, oldPrice: true, stockStatus: true, stockQty: true,
      leadTimeDays: true, isActive: true, brand: { select: { name: true } }, category: { select: { icon: true } },
      images: { select: { url: true }, take: 1, orderBy: { sort: "asc" as const } },
    },
  },
  vehicle: { select: { id: true, nickname: true } },
};

/** Знайти кошик без створення (для рендеру). */
async function findCart(userId: string | null) {
  if (userId) return db.cart.findUnique({ where: { userId }, include: { items: { include: itemInclude, orderBy: { id: "asc" } } } });
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return null;
  return db.cart.findUnique({ where: { guestToken: token }, include: { items: { include: itemInclude, orderBy: { id: "asc" } } } });
}

/** Отримати або створити кошик (тільки з server actions — може ставити cookie). */
async function ensureCartId(userId: string | null): Promise<string> {
  if (userId) {
    const cart = await db.cart.upsert({ where: { userId }, create: { userId }, update: {} });
    return cart.id;
  }
  const jar = await cookies();
  let token = jar.get(CART_COOKIE)?.value;
  if (token) {
    const existing = await db.cart.findUnique({ where: { guestToken: token } });
    if (existing) return existing.id;
  }
  token = randomUUID();
  const cart = await db.cart.create({ data: { guestToken: token } });
  jar.set(CART_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60 });
  return cart.id;
}

export async function getCartView(userId: string | null) {
  const cart = await findCart(userId);
  const items = (cart?.items ?? [])
    .filter((i) => i.product.isActive)
    .map((i) => ({
      id: i.id,
      qty: i.qty,
      vehicle: i.vehicle,
      product: {
        id: i.product.id, slug: i.product.slug, name: i.product.name, article: i.product.article, brand: i.product.brand.name,
        price: toNumber(i.product.price), oldPrice: i.product.oldPrice ? toNumber(i.product.oldPrice) : null,
        stockStatus: i.product.stockStatus, stockQty: i.product.stockQty, leadTimeDays: i.product.leadTimeDays,
        image: i.product.images[0]?.url ?? null, icon: i.product.category.icon,
      },
      lineTotal: toNumber(i.product.price) * i.qty,
    }));
  return {
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    total: items.reduce((s, i) => s + i.lineTotal, 0),
  };
}

export type CartView = Awaited<ReturnType<typeof getCartView>>;

export async function getCartCount(userId: string | null) {
  const cart = await findCart(userId);
  return cart?.items.reduce((s, i) => s + i.qty, 0) ?? 0;
}

export async function addToCart(userId: string | null, productId: string, qty = 1, vehicleId?: string | null) {
  const product = await db.product.findFirst({ where: { id: productId, isActive: true }, select: { id: true } });
  if (!product) throw new Error("Товар недоступний");
  if (vehicleId && userId) {
    const own = await db.vehicle.findFirst({ where: { id: vehicleId, userId }, select: { id: true } });
    if (!own) vehicleId = null;
  } else vehicleId = null;
  const cartId = await ensureCartId(userId);
  const existing = await db.cartItem.findUnique({ where: { cartId_productId: { cartId, productId } } });
  if (existing) {
    await db.cartItem.update({ where: { id: existing.id }, data: { qty: Math.min(MAX_QTY, existing.qty + qty), vehicleId: vehicleId ?? existing.vehicleId } });
  } else {
    await db.cartItem.create({ data: { cartId, productId, qty: Math.min(MAX_QTY, Math.max(1, qty)), vehicleId } });
  }
  await db.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
}

export async function addManyToCart(userId: string | null, items: { productId: string; qty: number }[], vehicleId?: string | null) {
  for (const it of items) await addToCart(userId, it.productId, it.qty, vehicleId);
}

async function ownItem(userId: string | null, itemId: string) {
  const cart = await findCart(userId);
  return cart?.items.find((i) => i.id === itemId) ?? null;
}

export async function updateCartQty(userId: string | null, itemId: string, qty: number) {
  const item = await ownItem(userId, itemId);
  if (!item) return;
  if (qty <= 0) await db.cartItem.delete({ where: { id: itemId } });
  else await db.cartItem.update({ where: { id: itemId }, data: { qty: Math.min(MAX_QTY, qty) } });
}

export async function removeCartItem(userId: string | null, itemId: string) {
  const item = await ownItem(userId, itemId);
  if (item) await db.cartItem.delete({ where: { id: itemId } });
}

export async function clearCart(userId: string | null) {
  const cart = await findCart(userId);
  if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id } });
}

/** Злиття гостьового кошика з кошиком користувача при вході. */
export async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (!token) return;
  const guest = await db.cart.findUnique({ where: { guestToken: token }, include: { items: true } });
  if (guest?.items.length) {
    const userCart = await db.cart.upsert({ where: { userId }, create: { userId }, update: {}, include: { items: true } });
    for (const it of guest.items) {
      const ex = userCart.items.find((u) => u.productId === it.productId);
      if (ex) await db.cartItem.update({ where: { id: ex.id }, data: { qty: Math.min(MAX_QTY, ex.qty + it.qty) } });
      else await db.cartItem.create({ data: { cartId: userCart.id, productId: it.productId, qty: it.qty } });
    }
  }
  if (guest) await db.cart.delete({ where: { id: guest.id } });
  jar.delete(CART_COOKIE);
}
