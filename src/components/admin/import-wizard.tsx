"use client";

import * as React from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { deleteTemplateAction, importPreviewAction, importRunAction, importUploadAction, saveTemplateAction } from "@/server/actions/admin";
import { IMPORT_FIELDS, type ImportOptions, type Mapping, type MappingTemplate } from "@/lib/import-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, NativeSelect } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Upload = { fileId: string; fileName: string; headers: string[]; total: number; sample: Record<string, string>[] };
type PreviewRow = { row: number; action: "create" | "update" | "error" | "skip"; message?: string; article?: string; brand?: string; name?: string; price?: number; stockQty?: number };
type Report = { total: number; created: number; updated: number; skipped: number; errors: { row: number; message: string }[] };

const STEPS = ["Файл", "Мапінг колонок", "Передперегляд", "Звіт"];
const ACTION = { create: { label: "Створити", tone: "green" }, update: { label: "Оновити", tone: "blue" }, error: { label: "Помилка", tone: "red" }, skip: { label: "Пропуск", tone: "neutral" } } as const;

export function ImportWizard({ categories }: { categories: { id: string; name: string }[] }) {
  const [step, setStep] = React.useState(0);
  const [up, setUp] = React.useState<Upload | null>(null);
  const [mapping, setMapping] = React.useState<Mapping>({});
  const [templates, setTemplates] = React.useState<MappingTemplate[]>([]);
  const [tplName, setTplName] = React.useState("");
  const [opts, setOpts] = React.useState<ImportOptions>({ createBrands: true, createProducts: true, applyMarkup: true, defaultCategoryId: categories[0]?.id });
  const [preview, setPreview] = React.useState<PreviewRow[] | null>(null);
  const [report, setReport] = React.useState<Report | null>(null);
  const [pending, start] = React.useTransition();

  const onUpload = (fd: FormData) =>
    start(async () => {
      const r = await importUploadAction(fd);
      if (!r.ok) return void toast.error(r.error);
      setUp({ fileId: r.fileId, fileName: r.fileName, headers: r.headers, total: r.total, sample: r.sample });
      setMapping(r.guess);
      setTemplates(r.templates);
      setStep(1);
    });

  const toPreview = () =>
    start(async () => {
      if (!mapping.article || !mapping.brand) return void toast.error("Вкажіть колонки «Артикул» і «Бренд»");
      const r = await importPreviewAction(up!.fileId, mapping, opts);
      if (!r.ok) return void toast.error(r.error);
      setPreview(r.rows);
      setStep(2);
    });

  const runImport = () =>
    start(async () => {
      const r = await importRunAction(up!.fileId, mapping, opts);
      if (!r.ok) return void toast.error(r.error);
      setReport(r.job);
      setStep(3);
      toast.success("Імпорт завершено");
    });

  const reset = () => { setStep(0); setUp(null); setPreview(null); setReport(null); setMapping({}); };

  return (
    <div className="grid gap-5">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold", i === step ? "border-primary bg-primary/10" : i < step ? "text-success" : "text-muted-foreground")}>
            <span className={cn("flex size-5 items-center justify-center rounded-full text-xs", i <= step ? "bg-primary text-primary-foreground" : "bg-muted")}>{i + 1}</span>{s}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <form action={onUpload} className="bg-grid grid place-items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <FileSpreadsheet className="size-10 text-primary" />
          <p className="font-bold">Завантажте прайс постачальника (.xlsx або .csv)</p>
          <p className="max-w-md text-sm text-muted-foreground">Перший рядок — заголовки колонок. Товари шукаються за парою «артикул + бренд»: існуючі оновлюються, нові створюються.</p>
          <input type="file" name="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="text-sm" aria-label="Файл імпорту" />
          <Button disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Upload />} Завантажити і розібрати</Button>
          <a href="/api/admin/import/sample" className="text-sm text-muted-foreground underline">Завантажити приклад CSV</a>
        </form>
      )}

      {step === 1 && up && (
        <div className="grid gap-5">
          <p className="text-sm">Файл <b>{up.fileName}</b> · рядків: <b>{up.total}</b> · колонок: {up.headers.length}</p>
          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b text-xs text-muted-foreground uppercase"><tr><th className="px-3 py-2 text-left">Поле каталогу</th><th className="px-3 py-2 text-left">Колонка у файлі</th><th className="px-3 py-2 text-left">Приклад</th></tr></thead>
                <tbody>
                  {IMPORT_FIELDS.map((f) => (
                    <tr key={f.key} className="border-b last:border-0">
                      <td className="px-3 py-2 font-semibold">{f.label}{"required" in f && f.required && <span className="text-danger"> *</span>}</td>
                      <td className="px-3 py-2">
                        <NativeSelect value={mapping[f.key] ?? ""} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value || undefined })} className="h-9" aria-label={f.label}>
                          <option value="">— не імпортувати —</option>
                          {up.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                        </NativeSelect>
                      </td>
                      <td className="max-w-48 truncate px-3 py-2 font-num text-xs text-muted-foreground">{mapping[f.key] ? up.sample[0]?.[mapping[f.key]!] : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid content-start gap-4">
              <div className="grid gap-2 rounded-xl border bg-card p-4">
                <p className="text-sm font-bold">Шаблони мапінгу</p>
                {templates.map((t) => (
                  <div key={t.name} className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="flex-1 justify-start" onClick={() => { setMapping(t.mapping); toast.success(`Шаблон «${t.name}» застосовано`); }}>{t.name}</Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Видалити шаблон" onClick={() => start(async () => { const r = await deleteTemplateAction(t.name); setTemplates(r.templates); })}><Trash2 /></Button>
                  </div>
                ))}
                {!templates.length && <p className="text-xs text-muted-foreground">Збережіть мапінг для постачальника — наступного разу застосуєте одним кліком.</p>}
                <div className="flex gap-1">
                  <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Назва (напр. «Прайс Knorr»)" className="h-9" aria-label="Назва шаблону" />
                  <Button size="sm" className="h-9" variant="secondary" disabled={!tplName.trim() || pending} onClick={() => start(async () => { const r = await saveTemplateAction(tplName, mapping); if (r.ok && r.templates) { setTemplates(r.templates); setTplName(""); toast.success("Шаблон збережено"); } else toast.error(r.error); })}><Save /></Button>
                </div>
              </div>
              <div className="grid gap-2.5 rounded-xl border bg-card p-4 text-sm">
                <p className="font-bold">Параметри</p>
                <label className="flex items-center gap-2"><Checkbox checked={opts.createProducts} onChange={(e) => setOpts({ ...opts, createProducts: e.target.checked })} /> Створювати нові товари</label>
                <label className="flex items-center gap-2"><Checkbox checked={opts.createBrands} onChange={(e) => setOpts({ ...opts, createBrands: e.target.checked })} /> Створювати нові бренди</label>
                <label className="flex items-center gap-2"><Checkbox checked={opts.applyMarkup} onChange={(e) => setOpts({ ...opts, applyMarkup: e.target.checked })} /> Рахувати ціну з закупівлі + націнка (якщо немає роздрібної)</label>
                <label className="grid gap-1">Категорія для нових товарів без категорії
                  <NativeSelect value={opts.defaultCategoryId} onChange={(e) => setOpts({ ...opts, defaultCategoryId: e.target.value })} className="h-9">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </NativeSelect>
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-2"><Button variant="ghost" onClick={reset}>Інший файл</Button><Button onClick={toPreview} disabled={pending}>{pending && <Loader2 className="animate-spin" />} Передперегляд →</Button></div>
        </div>
      )}

      {step === 2 && preview && (
        <div className="grid gap-4">
          <p className="text-sm">Перші {preview.length} рядків з {up?.total}. Створити: <b>{preview.filter((r) => r.action === "create").length}</b>, оновити: <b>{preview.filter((r) => r.action === "update").length}</b>, помилок: <b className="text-danger">{preview.filter((r) => r.action === "error").length}</b></p>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-xs text-muted-foreground uppercase"><tr>{["Рядок", "Дія", "Артикул", "Бренд", "Назва", "Ціна", "Залишок", "Примітка"].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.row} className="border-b last:border-0">
                    <td className="px-3 py-2 tabular-nums">{r.row}</td>
                    <td className="px-3 py-2"><Badge tone={ACTION[r.action].tone}>{ACTION[r.action].label}</Badge></td>
                    <td className="px-3 py-2 font-num text-xs">{r.article}</td>
                    <td className="px-3 py-2">{r.brand}</td>
                    <td className="max-w-64 truncate px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2 tabular-nums">{r.price ?? ""}</td>
                    <td className="px-3 py-2 tabular-nums">{r.stockQty ?? ""}</td>
                    <td className="px-3 py-2 text-xs text-danger">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2"><Button variant="ghost" onClick={() => setStep(1)}>← Мапінг</Button><Button onClick={runImport} disabled={pending}>{pending && <Loader2 className="animate-spin" />} Імпортувати всі {up?.total} рядків</Button></div>
        </div>
      )}

      {step === 3 && report && (
        <div className="grid gap-4">
          <div className="flex items-center gap-2 text-lg font-bold text-success"><CheckCircle2 /> Імпорт завершено</div>
          <div className="grid gap-3 sm:grid-cols-4">
            {[["Рядків", report.total], ["Створено", report.created], ["Оновлено", report.updated], ["Помилок / пропущено", `${report.errors.length} / ${report.skipped}`]].map(([k, v]) => (
              <div key={k as string} className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="text-2xl font-extrabold tabular-nums">{v}</p></div>
            ))}
          </div>
          {report.errors.length > 0 && (
            <div className="rounded-xl border border-danger/40 bg-card">
              <p className="border-b p-3 font-bold">Помилки</p>
              <ul className="max-h-80 divide-y overflow-y-auto text-sm">{report.errors.map((e, i) => <li key={i} className="px-3 py-1.5"><span className="font-num">Рядок {e.row}:</span> {e.message}</li>)}</ul>
            </div>
          )}
          <div><Button onClick={reset}>Імпортувати ще файл</Button></div>
        </div>
      )}
    </div>
  );
}
