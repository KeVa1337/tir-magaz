import { listAudit } from "@/server/services/audit";
import { PageHeader, Pagination } from "@/components/shared/misc";
import { NativeSelect } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { first, toQuery, type SP } from "@/lib/search-params";

export const metadata = { title: "Журнал дій" };

const ENTITY: Record<string, string> = {
  Order: "Замовлення", VinRequest: "VIN-запит", Product: "Товар", Category: "Категорія", PartBrand: "Бренд", VehicleMake: "Марка", VehicleSeries: "Серія",
  EngineCode: "Двигун", ServiceKit: "Комплект ТО", Banner: "Банер", Page: "Сторінка", Faq: "FAQ", Setting: "Налаштування", User: "Користувач", ImportJob: "Імпорт", Vehicle: "Авто клієнта",
};

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const sp = (await searchParams) as SP;
  const page = Number(first(sp.page)) || 1;
  const res = await listAudit({ page, entity: first(sp.entity) || undefined });
  return (
    <div className="grid gap-4">
      <PageHeader title="Журнал дій" description="Хто, що і коли змінив в адмінці" className="mb-0" />
      <form className="flex gap-2">
        <NativeSelect name="entity" defaultValue={first(sp.entity) ?? ""} className="h-9 w-56" aria-label="Сутність">
          <option value="">Усі сутності</option>
          {res.entities.map((e) => <option key={e} value={e}>{ENTITY[e] ?? e}</option>)}
        </NativeSelect>
        <Button size="sm" variant="secondary" className="h-9">Фільтрувати</Button>
      </form>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-xs text-muted-foreground uppercase"><tr>{["Час", "Хто", "Дія", "Об'єкт", "Зміни"].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {res.items.map((a) => (
              <tr key={a.id} className="border-b align-top last:border-0">
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{formatDateTime(a.createdAt)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{a.user.name}</td>
                <td className="px-3 py-2 font-num text-xs">{a.action}</td>
                <td className="px-3 py-2 whitespace-nowrap">{ENTITY[a.entity] ?? a.entity} <span className="font-num text-xs text-muted-foreground">{a.entityId.slice(0, 14)}</span></td>
                <td className="max-w-xl px-3 py-2"><code className="line-clamp-3 font-num text-xs break-all text-muted-foreground">{a.diff ? JSON.stringify(a.diff) : ""}</code></td>
              </tr>
            ))}
            {!res.items.length && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Записів немає</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.ceil(res.total / res.perPage)} makeHref={(p) => `/admin/audit${toQuery(sp, { page: String(p) })}`} />
    </div>
  );
}
