import { db } from "@/server/db";

export async function productFormRefs() {
  const [brands, cats] = await Promise.all([
    db.partBrand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.category.findMany({ orderBy: [{ sort: "asc" }], include: { parent: { select: { name: true } } } }),
  ]);
  return { brands, categories: cats.map((c) => ({ id: c.id, name: c.name, parent: c.parent?.name })).sort((a, b) => (a.parent ?? a.name).localeCompare(b.parent ?? b.name, "uk")) };
}
