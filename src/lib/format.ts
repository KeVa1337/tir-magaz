const uah = new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", minimumFractionDigits: 0, maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});
const intFmt = new Intl.NumberFormat("uk-UA");

type Num = number | string | { toString(): string } | null | undefined;

export function toNumber(v: Num): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v.toString());
}

/**
 * Intl у Node і в браузері може мати різні версії ICU («₴» vs «грн», різні пробіли),
 * що ламає гідрацію. Тому символ валюти і роздільники нормалізуємо.
 */
function stable(parts: Intl.NumberFormatPart[]): string {
  return parts
    .map((p) => (p.type === "currency" ? "₴" : p.type === "group" || p.type === "literal" ? "\u00a0" : p.value))
    .join("");
}

export function formatPrice(v: Num): string {
  return stable(uah.formatToParts(toNumber(v)));
}

export function formatDate(d: Date | string): string {
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string): string {
  return dateTimeFmt.format(new Date(d));
}

export function formatInt(n: number | null | undefined): string {
  return n == null ? "—" : stable(intFmt.formatToParts(n));
}

export function formatKm(n: number | null | undefined): string {
  return n == null ? "—" : `${formatInt(n)} км`;
}

export function pluralUa(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

export function timeAgo(d: Date | string, now = new Date()): string {
  const diff = Math.round((now.getTime() - new Date(d).getTime()) / 60000);
  if (diff < 1) return "щойно";
  if (diff < 60) return `${diff} хв тому`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h} год тому`;
  const days = Math.floor(h / 24);
  return `${days} ${pluralUa(days, ["день", "дні", "днів"])} тому`;
}
