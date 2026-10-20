/** Нормалізація номерів деталей і VIN: UPPER, тільки A-Z і 0-9. */
export function normalize(s: string | null | undefined): string {
  return (s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Транслітерація + slug для URL. */
const UA_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z",
  и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ь: "", ю: "iu", я: "ia", "'": "", "’": "", ы: "y", э: "e", ё: "e", ъ: "",
};

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .split("")
    .map((ch) => UA_MAP[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Схоже на VIN: 17 символів без I/O/Q. */
export function looksLikeVin(s: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalize(s));
}
