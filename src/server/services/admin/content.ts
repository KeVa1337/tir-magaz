import "server-only";
import { db } from "@/server/db";
import { slugify } from "@/lib/normalize";
import { logAudit } from "../audit";

export async function adminContent() {
  const [banners, pages, faq] = await Promise.all([
    db.banner.findMany({ orderBy: { sort: "asc" } }),
    db.page.findMany({ orderBy: { slug: "asc" } }),
    db.faq.findMany({ orderBy: { sort: "asc" } }),
  ]);
  return { banners, pages, faq };
}

export async function adminSaveBanner(data: { id?: string; title: string; subtitle?: string; link?: string; linkText?: string; imageUrl?: string; sort: number; isActive: boolean }, byUserId: string) {
  const payload = { title: data.title, subtitle: data.subtitle || null, link: data.link || null, linkText: data.linkText || null, imageUrl: data.imageUrl || null, sort: data.sort, isActive: data.isActive };
  const b = data.id ? await db.banner.update({ where: { id: data.id }, data: payload }) : await db.banner.create({ data: payload });
  await logAudit(byUserId, data.id ? "update" : "create", "Banner", b.id, { title: b.title });
}
export async function adminDeleteBanner(id: string, byUserId: string) {
  await db.banner.delete({ where: { id } });
  await logAudit(byUserId, "delete", "Banner", id);
}

export async function adminSavePage(data: { id?: string; slug: string; title: string; content: string }, byUserId: string) {
  const slug = slugify(data.slug);
  const clash = await db.page.findUnique({ where: { slug } });
  if (clash && clash.id !== data.id) throw new Error("Сторінка з таким slug вже існує");
  const p = data.id ? await db.page.update({ where: { id: data.id }, data: { slug, title: data.title, content: data.content } }) : await db.page.create({ data: { slug, title: data.title, content: data.content } });
  await logAudit(byUserId, data.id ? "update" : "create", "Page", p.id, { slug });
}

export async function adminSaveFaq(data: { id?: string; question: string; answer: string; sort: number; isActive: boolean }, byUserId: string) {
  const f = data.id ? await db.faq.update({ where: { id: data.id }, data }) : await db.faq.create({ data });
  await logAudit(byUserId, data.id ? "update" : "create", "Faq", f.id);
}
export async function adminDeleteFaq(id: string, byUserId: string) {
  await db.faq.delete({ where: { id } });
  await logAudit(byUserId, "delete", "Faq", id);
}
