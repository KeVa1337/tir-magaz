import { normalize } from "@/lib/normalize";
import type { DecodedVin, VinProvider, WmiEntry } from "./types";

const YEAR_CODES = "ABCDEFGHJKLMNPRSTVWXY123456789";
const TRANSLIT: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function vinCheckDigit(vin: string): string {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = vin[i];
    const v = /\d/.test(ch) ? Number(ch) : (TRANSLIT[ch] ?? 0);
    sum += v * WEIGHTS[i];
  }
  const r = sum % 11;
  return r === 10 ? "X" : String(r);
}

/** Рік за 10-м символом: кандидати з кроком 30 років, найімовірніший — найпізніший не з майбутнього. */
export function modelYearCandidates(code: string, now = new Date()): number[] {
  const idx = YEAR_CODES.indexOf(code);
  if (idx < 0) return [];
  const maxYear = now.getFullYear() + 1;
  const out: number[] = [];
  for (let y = 1980 + idx; y <= maxYear; y += 30) out.push(y);
  return out.reverse();
}

/**
 * Локальний декодер рівня 0: формат, WMI → марка/тип, рік, серійна частина.
 * Таблицю WMI передаємо ззовні (з БД), щоб провайдер був чистим і тестованим.
 */
export class LocalVinProvider implements VinProvider {
  name = "local";
  constructor(private loadWmi: () => Promise<WmiEntry[]>) {}

  async decode(input: string): Promise<DecodedVin> {
    const vin = normalize(input);
    const issues: string[] = [];
    if (vin.length !== 17) issues.push(`VIN має містити 17 символів (зараз ${vin.length})`);
    if (/[IOQ]/.test(vin)) issues.push("VIN не може містити літери I, O, Q");
    const valid = issues.length === 0;

    const wmi = vin.slice(0, 3);
    const table = await this.loadWmi();
    const entry =
      table.find((w) => w.code === wmi) ?? table.find((w) => w.code.length === 2 && wmi.startsWith(w.code));

    let checkDigit: DecodedVin["checkDigit"] = "n/a";
    if (valid) checkDigit = vinCheckDigit(vin) === vin[8] ? "valid" : "mismatch";

    const years = vin.length >= 10 ? modelYearCandidates(vin[9]) : [];
    if (!entry && vin.length >= 3) issues.push(`Виробника з кодом WMI «${wmi}» немає в довіднику`);

    let confidence: DecodedVin["confidence"] = "low";
    if (valid && entry) confidence = checkDigit === "valid" ? "high" : "medium";

    return {
      vin,
      valid,
      issues,
      wmi,
      checkDigit,
      make: entry?.make,
      makeId: entry?.makeId,
      kind: entry?.kind,
      modelYear: years[0],
      modelYearCandidates: years,
      vds: vin.length >= 9 ? vin.slice(3, 9) : undefined,
      serial: vin.length === 17 ? vin.slice(11) : undefined,
      confidence,
      source: this.name,
    };
  }
}
