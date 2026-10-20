import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";

/** Кожна мутація в адмінці пише запис у журнал дій (SPEC §13). */
export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  diff?: Prisma.InputJsonValue,
) {
  await db.auditLog.create({ data: { userId, action, entity, entityId, diff } });
}

export async function listAudit({ page = 1, entity, userId }: { page?: number; entity?: string; userId?: string }) {
  const where: Prisma.AuditLogWhereInput = { ...(entity ? { entity } : {}), ...(userId ? { userId } : {}) };
  const perPage = 50;
  const [items, total, entities] = await Promise.all([
    db.auditLog.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * perPage, take: perPage,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.auditLog.count({ where }),
    db.auditLog.findMany({ distinct: ["entity"], select: { entity: true } }),
  ]);
  return { items, total, perPage, entities: entities.map((e) => e.entity) };
}

/** Різниця між старими і новими значеннями — тільки змінені поля. */
export function diffOf(before: Record<string, unknown>, after: Record<string, unknown>) {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const k of Object.keys(after)) {
    const a = before[k] == null ? null : String(before[k]);
    const b = after[k] == null ? null : String(after[k]);
    if (a !== b) out[k] = { from: before[k] ?? null, to: after[k] ?? null };
  }
  return JSON.parse(JSON.stringify(out)) as Prisma.InputJsonValue;
}
