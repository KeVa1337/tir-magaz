import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { Prisma, type StockStatus } from "@prisma/client";
import { db } from "@/server/db";
import { normalize, slugify } from "@/lib/normalize";
import { logAudit } from "../audit";
import { getSetting, getSettings, setSetting } from "../settings";

const DIR = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads", "../imports");

import { IMPORT_FIELDS, type ImportField, type ImportOptions, type Mapping, type MappingTemplate } from "@/lib/import-fields";

export type { ImportField, ImportOptions, Mapping, MappingTemplate };
interface Parsed { fileName: string; headers: string[]; rows: Record<string, string>[] }

function cell(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object") {
    if ("result" in v && v.result != null) return String(v.result);
    if ("text" in v) return String(v.text);
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  return String(v).trim();
}

/** Розбір XLSX/CSV → тимчасовий JSON на диску; повертає id файлу, заголовки і перші 20 рядків. */
export async function parseUpload(file: File) {
  const name = file.name;
  const buf = Buffer.from(await file.arrayBuffer());
  let headers: string[] = [];
  let rows: Record<string, string>[] = [];
  if (/\.csv$/i.test(name) || file.type === "text/csv") {
    const text = buf.toString("utf8").replace(/^﻿/, "");
    const res = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
    headers = (res.meta.fields ?? []).filter(Boolean);
    rows = res.data;
  } else if (/\.xlsx$/i.test(name)) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) throw new Error("У файлі немає аркушів");
    ws.getRow(1).eachCell({ includeEmpty: false }, (c, col) => (headers[col - 1] = cell(c.value) || `Колонка ${col}`));
    headers = Array.from(headers, (h, i) => h ?? `Колонка ${i + 1}`);
    ws.eachRow((row, idx) => {
      if (idx === 1) return;
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => (obj[h] = cell(row.getCell(i + 1).value)));
      if (Object.values(obj).some(Boolean)) rows.push(obj);
    });
  } else {
    throw new Error("Підтримуються файли .xlsx і .csv");
  }
  if (!headers.length || !rows.length) throw new Error("Файл порожній або без заголовків у першому рядку");
  const id = randomUUID();
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, `${id}.json`), JSON.stringify({ fileName: name, headers, rows } satisfies Parsed));
  return { fileId: id, fileName: name, headers, total: rows.length, sample: rows.slice(0, 20), guess: guessMapping(headers) };
}

async function loadParsed(fileId: string): Promise<Parsed> {
  if (!/^[0-9a-f-]{36}$/.test(fileId)) throw new Error("Некоректний файл");
  return JSON.parse(await readFile(path.join(DIR, `${fileId}.json`), "utf8"));
}

const GUESS: Record<ImportField, RegExp> = {
  article: /^(артикул|article|код виробника|part ?no|номер)/i,
  brand: /^(бренд|виробник|brand|марка)/i,
  name: /^(назва|найменування|name|товар)/i,
  price: /^(ціна|price|роздріб|цена)(?!.*закуп)/i,
  purchasePrice: /(закуп|purchase|вхідна)/i,
  oldPrice: /(стара|old)/i,
  stockQty: /^(залишок|кількість|наявність|stock|qty|к-сть)/i,
  leadTimeDays: /(термін|lead|дн)/i,
  category: /^(категорія|група|category)/i,
  oe: /^(oe|оригінал|ое)/i,
  cross: /(крос|cross|аналог)/i,
  description: /^(опис|description)/i,
  weightKg: /^(вага|weight)/i,
};

function guessMapping(headers: string[]): Mapping {
  const m: Mapping = {};
  for (const f of IMPORT_FIELDS) {
    const h = headers.find((x) => GUESS[f.key].test(x.trim()) && !Object.values(m).includes(x));
    if (h) m[f.key] = h;
  }
  return m;
}

const num = (s: string | undefined) => {
  if (s == null || s === "") return undefined;
  const n = Number(String(s).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};
const list = (s: string | undefined) => (s ?? "").split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);

function stockStatusFor(qty: number | undefined, lead: number | undefined): StockStatus | undefined {
  if (qty === undefined) return undefined;
  if (qty > 3) return "IN_STOCK";
  if (qty > 0) return "LOW";
  return lead ? "ON_ORDER" : "OUT_OF_STOCK";
}

interface RowPlan {
  row: number; action: "create" | "update" | "error" | "skip"; message?: string;
  article?: string; brand?: string; name?: string; price?: number; stockQty?: number;
}

async function planRows(rows: Record<string, string>[], mapping: Mapping, opts: ImportOptions, offset = 2) {
  const get = (r: Record<string, string>, f: ImportField) => (mapping[f] ? (r[mapping[f]!] ?? "").toString().trim() : undefined);
  const brands = await db.partBrand.findMany({ select: { id: true, name: true } });
  const brandMap = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));
  const plans: (RowPlan & { data?: ReturnType<typeof buildData> })[] = [];

  function buildData(r: Record<string, string>) {
    return {
      article: get(r, "article")!, brand: get(r, "brand")!, name: get(r, "name"), price: num(get(r, "price")), purchasePrice: num(get(r, "purchasePrice")),
      oldPrice: num(get(r, "oldPrice")), stockQty: num(get(r, "stockQty")), leadTimeDays: num(get(r, "leadTimeDays")), category: get(r, "category"),
      oe: list(get(r, "oe")), cross: list(get(r, "cross")), description: get(r, "description"), weightKg: num(get(r, "weightKg")),
    };
  }

  for (const [i, r] of rows.entries()) {
    const row = i + offset;
    const d = buildData(r);
    if (!d.article || !normalize(d.article)) { plans.push({ row, action: "error", message: "Порожній артикул" }); continue; }
    if (!d.brand) { plans.push({ row, action: "error", message: "Порожній бренд", article: d.article }); continue; }
    const bad = (["price", "purchasePrice", "oldPrice", "stockQty", "leadTimeDays", "weightKg"] as const).find((k) => Number.isNaN(d[k]));
    if (bad) { plans.push({ row, action: "error", message: `Некоректне число в полі «${IMPORT_FIELDS.find((f) => f.key === bad)!.label}»`, article: d.article }); continue; }
    const brandId = brandMap.get(d.brand.toLowerCase());
    if (!brandId && !opts.createBrands) { plans.push({ row, action: "error", message: `Бренд «${d.brand}» не знайдено`, article: d.article }); continue; }
    const existing = brandId ? await db.product.findFirst({ where: { articleNorm: normalize(d.article), brandId }, select: { id: true } }) : null;
    if (existing) { plans.push({ row, action: "update", article: d.article, brand: d.brand, name: d.name, price: d.price, stockQty: d.stockQty, data: d }); continue; }
    if (!opts.createProducts) { plans.push({ row, action: "skip", message: "Нового товару немає в каталозі", article: d.article, brand: d.brand }); continue; }
    if (!d.name) { plans.push({ row, action: "error", message: "Для нового товару потрібна назва", article: d.article }); continue; }
    if (d.price === undefined && d.purchasePrice === undefined) { plans.push({ row, action: "error", message: "Для нового товару потрібна ціна", article: d.article }); continue; }
    plans.push({ row, action: "create", article: d.article, brand: d.brand, name: d.name, price: d.price, stockQty: d.stockQty, data: d });
  }
  return plans;
}

export async function previewImport(fileId: string, mapping: Mapping, opts: ImportOptions) {
  const parsed = await loadParsed(fileId);
  const plans = await planRows(parsed.rows.slice(0, 20), mapping, opts);
  return plans.map(({ data: _data, ...p }) => p);
}

export async function runImport(fileId: string, mapping: Mapping, opts: ImportOptions, byUserId: string) {
  if (!mapping.article || !mapping.brand) throw new Error("Вкажіть колонки «Артикул» і «Бренд»");
  const parsed = await loadParsed(fileId);
  const { commerce } = await getSettings();
  const plans = await planRows(parsed.rows, mapping, opts);
  const cats = await db.category.findMany({ select: { id: true, name: true, slug: true } });
  const fallbackCat = opts.defaultCategoryId ?? cats[0]?.id;
  let created = 0, updated = 0, skipped = 0;
  const errors: { row: number; message: string }[] = [];
  let seq = Number((await db.product.findFirst({ where: { sku: { startsWith: "TP-" } }, orderBy: { sku: "desc" }, select: { sku: true } }))?.sku.slice(3) ?? 10000);

  for (const p of plans) {
    if (p.action === "error") { errors.push({ row: p.row, message: p.message! }); continue; }
    if (p.action === "skip" || !p.data) { skipped++; continue; }
    const d = p.data;
    try {
      let brand = await db.partBrand.findFirst({ where: { name: { equals: d.brand, mode: "insensitive" } } });
      if (!brand) brand = await db.partBrand.create({ data: { name: d.brand, slug: slugify(d.brand) || `brand-${Date.now()}` } });
      let price = d.price;
      if (price === undefined && d.purchasePrice !== undefined && opts.applyMarkup) price = Math.round(d.purchasePrice * (1 + commerce.defaultMarkupPercent / 100));
      const category = d.category ? cats.find((c) => c.name.toLowerCase() === d.category!.toLowerCase() || c.slug === d.category) : undefined;
      const stockStatus = stockStatusFor(d.stockQty, d.leadTimeDays);
      const numbers = [
        ...d.oe.map((n) => ({ number: n, numberNorm: normalize(n), type: "OE" as const })),
        ...d.cross.map((n) => ({ number: n, numberNorm: normalize(n), type: "CROSS" as const })),
      ].filter((n) => n.numberNorm);

      const common = {
        ...(d.name ? { name: d.name } : {}),
        ...(price !== undefined ? { price: new Prisma.Decimal(price) } : {}),
        ...(d.purchasePrice !== undefined ? { purchasePrice: new Prisma.Decimal(d.purchasePrice) } : {}),
        ...(d.oldPrice !== undefined ? { oldPrice: new Prisma.Decimal(d.oldPrice) } : {}),
        ...(d.stockQty !== undefined ? { stockQty: Math.max(0, Math.round(d.stockQty)), stockStatus } : {}),
        ...(d.leadTimeDays !== undefined ? { leadTimeDays: Math.round(d.leadTimeDays) } : {}),
        ...(d.description ? { description: d.description } : {}),
        ...(d.weightKg !== undefined ? { weightKg: new Prisma.Decimal(d.weightKg) } : {}),
        ...(category ? { categoryId: category.id } : {}),
      };

      const existing = await db.product.findFirst({ where: { articleNorm: normalize(d.article), brandId: brand.id }, include: { numbers: true } });
      if (existing) {
        await db.product.update({ where: { id: existing.id }, data: common });
        const have = new Set(existing.numbers.map((n) => `${n.type}:${n.numberNorm}`));
        const add = numbers.filter((n) => !have.has(`${n.type}:${n.numberNorm}`));
        if (add.length) await db.productNumber.createMany({ data: add.map((n) => ({ ...n, productId: existing.id })) });
        updated++;
      } else {
        let slug = slugify(`${d.name}-${brand.name}-${d.article}`);
        if (await db.product.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
        await db.product.create({
          data: {
            sku: `TP-${++seq}`, article: d.article, articleNorm: normalize(d.article), name: d.name!, slug, brandId: brand.id,
            categoryId: category?.id ?? fallbackCat!, price: new Prisma.Decimal(price ?? 0), ...common,
            stockStatus: stockStatus ?? "OUT_OF_STOCK",
            numbers: { create: numbers },
          },
        });
        created++;
      }
    } catch (e) {
      errors.push({ row: p.row, message: (e as Error).message.slice(0, 200) });
    }
  }

  const job = await db.importJob.create({
    data: {
      fileName: parsed.fileName, mapping, status: errors.length ? "done_with_errors" : "done", total: parsed.rows.length,
      created, updated, skipped, errors: errors.slice(0, 500), byUserId,
    },
  });
  await logAudit(byUserId, "import", "ImportJob", job.id, { fileName: parsed.fileName, created, updated, skipped, errors: errors.length });
  return job;
}

export async function listImportJobs() {
  return db.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { byUser: { select: { name: true } } } });
}

// шаблони мапінгу
export async function getTemplates() {
  return (await getSetting<MappingTemplate[]>("import.templates")) ?? [];
}
export async function saveTemplate(name: string, mapping: Mapping) {
  const list = (await getTemplates()).filter((t) => t.name !== name);
  list.push({ name, mapping });
  await setSetting("import.templates", JSON.parse(JSON.stringify(list)));
}
export async function deleteTemplate(name: string) {
  await setSetting("import.templates", JSON.parse(JSON.stringify((await getTemplates()).filter((t) => t.name !== name))));
}
