import "server-only";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Демо-сховище файлів на локальному диску. Файли віддаються через /api/files/…,
 * бо вміст public/ у продакшен-збірці фіксується на момент build.
 * 🟡 Пізніше: S3 / Cloudflare R2.
 */
const ROOT = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "application/pdf": "pdf",
};

export async function saveUpload(file: File, dir: "products" | "vin" | "banners"): Promise<string> {
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Дозволені тільки зображення (JPG, PNG, WEBP) або PDF");
  if (file.size > MAX_BYTES) throw new Error("Файл більший за 5 МБ");
  const name = `${randomUUID()}.${ext}`;
  await mkdir(path.join(ROOT, dir), { recursive: true });
  await writeFile(path.join(ROOT, dir, name), Buffer.from(await file.arrayBuffer()));
  return `/api/files/${dir}/${name}`;
}

export async function saveUploads(files: File[], dir: "products" | "vin" | "banners", max = 5) {
  const real = files.filter((f) => f && f.size > 0).slice(0, max);
  return Promise.all(real.map((f) => saveUpload(f, dir)));
}

export async function readUpload(parts: string[]) {
  const rel = path.normalize(parts.join("/"));
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  const full = path.join(ROOT, rel);
  if (!full.startsWith(ROOT)) return null;
  try {
    const data = await readFile(full);
    const ext = path.extname(full).slice(1);
    const type = Object.entries(ALLOWED).find(([, e]) => e === ext)?.[0] ?? "application/octet-stream";
    return { data, type };
  } catch {
    return null;
  }
}
