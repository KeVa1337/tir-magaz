import { requireRole } from "@/server/auth/guards";
import { listImportJobs } from "@/server/services/admin/import";
import { db } from "@/server/db";
import { ImportWizard } from "@/components/admin/import-wizard";
import { PageHeader } from "@/components/shared/misc";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Імпорт товарів" };

export default async function ImportPage() {
  await requireRole("ADMIN", undefined, "/admin?denied=1");
  const [jobs, cats] = await Promise.all([listImportJobs(), db.category.findMany({ where: { parentId: { not: null } }, orderBy: { name: "asc" }, select: { id: true, name: true } })]);
  return (
    <div className="grid gap-6">
      <PageHeader title="Імпорт товарів" description="XLSX/CSV від постачальників: ціни, залишки, нові позиції, OE- і крос-номери" className="mb-0" />
      <ImportWizard categories={cats} />
      <Card>
        <CardHeader><CardTitle>Історія імпортів</CardTitle></CardHeader>
        <div className="overflow-x-auto border-t">
          <table className="w-full text-sm">
            <thead className="border-b text-xs text-muted-foreground uppercase"><tr>{["Дата", "Файл", "Хто", "Рядків", "Створено", "Оновлено", "Пропущено", "Помилок", "Статус"].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-b last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{formatDateTime(j.createdAt)}</td>
                  <td className="px-3 py-2 font-semibold">{j.fileName}</td>
                  <td className="px-3 py-2">{j.byUser.name}</td>
                  <td className="px-3 py-2 tabular-nums">{j.total}</td>
                  <td className="px-3 py-2 tabular-nums">{j.created}</td>
                  <td className="px-3 py-2 tabular-nums">{j.updated}</td>
                  <td className="px-3 py-2 tabular-nums">{j.skipped}</td>
                  <td className="px-3 py-2 tabular-nums">{Array.isArray(j.errors) ? j.errors.length : 0}</td>
                  <td className="px-3 py-2"><Badge tone={j.status === "done" ? "green" : "amber"}>{j.status === "done" ? "успішно" : "з помилками"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
