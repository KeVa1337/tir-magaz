import { test } from "node:test";
import assert from "node:assert/strict";
import { LocalVinProvider, modelYearCandidates, vinCheckDigit } from "../src/server/vin/local-provider";

const provider = new LocalVinProvider(async () => [
  { code: "XLR", makeId: "daf", make: "DAF", kind: "TRACTOR" },
  { code: "WSM", makeId: "schmitz", make: "Schmitz Cargobull", kind: "TRAILER" },
]);

test("контрольний символ за ISO 3779", () => {
  assert.equal(vinCheckDigit("1M8GDM9AXKP042788"), "X");
});

test("рік: кандидати з кроком 30 років, найновіший першим", () => {
  assert.deepEqual(modelYearCandidates("G", new Date("2026-01-01")), [2016, 1986]);
  assert.deepEqual(modelYearCandidates("Q"), []);
});

test("декодування DAF: марка, тип, рік, серійна частина", async () => {
  const d = await provider.decode("XLRTEH439GE512345");
  assert.equal(d.valid, true);
  assert.equal(d.make, "DAF");
  assert.equal(d.kind, "TRACTOR");
  assert.equal(d.modelYear, 2016);
  assert.equal(d.serial, "512345");
  assert.equal(d.confidence, "high");
});

test("невалідний VIN і невідомий WMI", async () => {
  const d = await provider.decode("ABC123");
  assert.equal(d.valid, false);
  assert.equal(d.confidence, "low");
  assert.ok(d.issues.length >= 2);
});
