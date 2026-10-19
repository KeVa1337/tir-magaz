import type { VehicleKind } from "@prisma/client";

export interface DecodedVin {
  vin: string;
  valid: boolean;
  /** Причини невалідності / зауваження для UI. */
  issues: string[];
  wmi: string;
  /** Чи збігається контрольний символ (поз. 9). Для європейських вантажівок не обов'язковий. */
  checkDigit: "valid" | "mismatch" | "n/a";
  make?: string;
  makeId?: string;
  kind?: VehicleKind;
  /** Найімовірніший рік (цикл 30 років) і всі кандидати. */
  modelYear?: number;
  modelYearCandidates?: number[];
  /** Символи 4–9 — опис моделі (VDS). */
  vds?: string;
  /** Символи 12–17 — порівнюється з діапазонами шасі. */
  serial?: string;
  confidence: "low" | "medium" | "high";
  source: string;
  raw?: unknown;
}

export interface VinProvider {
  name: string;
  decode(vin: string): Promise<DecodedVin | null>;
  findParts?(vin: string, opts?: { category?: string }): Promise<{ oeNumbers: string[] } | null>;
}

export interface WmiEntry {
  code: string;
  makeId: string;
  make: string;
  kind: VehicleKind;
}
