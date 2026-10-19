import "server-only";
import { db } from "@/server/db";
import { toNumber } from "@/lib/format";

export async function dashboardStats(days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  since.setHours(0, 0, 0, 0);
  const [newOrders, vinQueue, orders, noPhoto, noPrice, imports, recentOrders, customers] = await Promise.all([
    db.order.count({ where: { status: "NEW" } }),
    db.vinRequest.findMany({
      where: { status: { in: ["NEW", "IN_PROGRESS"] } },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true } }, vehicle: { include: { make: true, series: true } }, assignedTo: { select: { name: true } } },
      take: 8,
    }),
    db.order.findMany({ where: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "RETURNED"] } }, select: { createdAt: true, total: true } }),
    db.product.count({ where: { isActive: true, images: { none: {} } } }),
    db.product.count({ where: { isActive: true, price: { lte: 0 } } }),
    db.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 4, include: { byUser: { select: { name: true } } } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: { select: { qty: true } } } }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: since } } }),
  ]);

  // продажі по днях
  const byDay = new Map<string, { revenue: number; count: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    byDay.set(d.toISOString().slice(0, 10), { revenue: 0, count: 0 });
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const cur = byDay.get(key);
    if (cur) {
      cur.revenue += toNumber(o.total);
      cur.count += 1;
    }
  }
  const series = [...byDay.entries()].map(([date, v]) => ({ date, ...v }));
  const revenue = series.reduce((s, d) => s + d.revenue, 0);
  const count = series.reduce((s, d) => s + d.count, 0);

  return {
    newOrders, vinQueue, noPhoto, noPrice, imports, recentOrders, newCustomers: customers,
    sales: { series, revenue, count, avg: count ? revenue / count : 0, days },
  };
}
