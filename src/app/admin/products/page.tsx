import Link from "next/link";
import type { StockStatus } from "@prisma/client";
import { Plus } from "lucide-react";
import { adminListProducts } from "@/server/services/admin/products";
import { db } from "@/server/db";
import { ProductsTable } from "@/components/admin/products-table";
import { PageHeader, Pagination } from "@/components/shared/misc";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { STOCK_STATUS } from "@/lib/labels";
import { first, toQuery, type SP } from "@/lib/search-params";

export const metadata = { title: "Товари" };

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const sp = (await searchParams) as SP;
  const [res, cats, brands] = await Promise.all([
    adminListProducts({
      q: first(sp.q), categoryId: first(sp.category), brandId: first(sp.brand), stock: first(sp.stock) as StockStatus | undefined,
      flag: first(sp.flag) as "nophoto" | undefined, page: Number(first(sp.page)) || 1, sort: first(sp.sort), dir: first(sp.dir) === "desc" ? "desc" : "asc",
    }),
    db.category.findMany({ orderBy: [{ parentId: "asc" }, { sort: "asc" }], include: { parent: { select: { name: true } } } }),
    db.partBrand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <div className="grid gap-4">
      <PageHeader title="Товари" description={`Знайдено: ${res.total}. Клікніть ціну або залишок, щоб змінити.`} className="mb-0">
        <Button asChild><Link href="/admin/products/new"><Plus /> Новий товар</Link></Button>
      </PageHeader>
      {first(sp.deleted) && <p className="rounded-md bg-success/10 p-3 text-sm text-success">Товар видалено.</p>}
      {first(sp.deactivated) && <p className="rounded-md bg-warning/10 p-3 text-sm text-warning">Товар є в замовленнях — його деактивовано замість видалення.</p>}
      <form className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={first(sp.q)} placeholder="Назва, артикул, OE, код" className="h-9 w-64" aria-label="Пошук" />
        <NativeSelect name="category" defaultValue={first(sp.category) ?? ""} className="h-9 w-52" aria-label="Категорія">
          <option value="">Усі категорії</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.parent ? `— ${c.name}` : c.name}</option>)}
        </NativeSelect>
        <NativeSelect name="brand" defaultValue={first(sp.brand) ?? ""} className="h-9 w-44" aria-label="Бренд">
          <option value="">Усі бренди</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </NativeSelect>
        <NativeSelect name="stock" defaultValue={first(sp.stock) ?? ""} className="h-9 w-44" aria-label="Наявність">
          <option value="">Будь-яка наявність</option>
          {(Object.keys(STOCK_STATUS) as StockStatus[]).map((s) => <option key={s} value={s}>{STOCK_STATUS[s].label}</option>)}
        </NativeSelect>
        <NativeSelect name="flag" defaultValue={first(sp.flag) ?? ""} className="h-9 w-48" aria-label="Якість даних">
          <option value="">Усі товари</option>
          <option value="nophoto">Без фото</option>
          <option value="noprice">Без ціни</option>
          <option value="nofit">Без застосовності</option>
          <option value="inactive">Неактивні</option>
        </NativeSelect>
        <Button size="sm" variant="secondary" className="h-9">Фільтрувати</Button>
      </form>
      <ProductsTable rows={res.items} categories={cats.map((c) => ({ id: c.id, name: c.name, parent: c.parent?.name }))} />
      <Pagination page={res.page} pages={Math.ceil(res.total / res.perPage)} makeHref={(p) => `/admin/products${toQuery(sp, { page: String(p) })}`} />
    </div>
  );
}
