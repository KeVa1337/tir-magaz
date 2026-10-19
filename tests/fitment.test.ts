import { test } from "node:test";
import assert from "node:assert/strict";
import { compareChassis, evaluateFit, type FitmentLite, type VehicleContext } from "../src/server/services/fitment-rules";

const rule = (r: Partial<FitmentLite>): FitmentLite => ({
  makeId: null, seriesId: null, engineCodeId: null, axleBrand: null, yearFrom: null, yearTo: null, chassisFrom: null, chassisTo: null, position: null, note: null, ...r,
});
const daf: VehicleContext = {
  source: "garage", label: "DAF XF 106", shortLabel: "DAF XF 106", kind: "TRACTOR",
  makeId: "daf", seriesId: "xf106", engineCodeId: "mx13", year: 2016, chassis: "512345", oeNumbers: ["1643070"],
};
const product = (fitments: FitmentLite[], extra: Partial<{ articleNorm: string; isUniversal: boolean; numbers: { numberNorm: string }[] }> = {}) => ({
  articleNorm: "X1", isUniversal: false, numbers: [], fitments, ...extra,
});

test("точний збіг за правилом: марка, серія, двигун, роки", () => {
  const r = evaluateFit(product([rule({ makeId: "daf", seriesId: "xf106", engineCodeId: "mx13", yearFrom: 2013, yearTo: 2021 })]), daf);
  assert.equal(r.status, "fits");
});

test("збіг за OE-номером, прив'язаним до авто, важливіший за правила", () => {
  const r = evaluateFit(product([rule({ makeId: "man" })], { numbers: [{ numberNorm: "1643070" }] }), daf);
  assert.equal(r.status, "fits");
});

test("діапазон шасі: до 499999 не підходить, від 500000 — підходить", () => {
  assert.equal(evaluateFit(product([rule({ makeId: "daf", seriesId: "xf106", chassisFrom: "000001", chassisTo: "499999" })]), daf).status, "no");
  assert.equal(evaluateFit(product([rule({ makeId: "daf", seriesId: "xf106", chassisFrom: "500000", chassisTo: "999999" })]), daf).status, "fits");
});

test("збіг лише за маркою — «уточнити»", () => {
  assert.equal(evaluateFit(product([rule({ makeId: "daf" })]), daf).status, "maybe");
});

test("невідомий двигун у авто — «уточнити», інший двигун — «не підходить»", () => {
  const noEngine = { ...daf, engineCodeId: undefined };
  assert.equal(evaluateFit(product([rule({ makeId: "daf", seriesId: "xf106", engineCodeId: "mx13" })]), noEngine).status, "maybe");
  assert.equal(evaluateFit(product([rule({ makeId: "daf", seriesId: "xf106", engineCodeId: "mx11" })]), daf).status, "no");
});

test("причіп: правило за маркою осей", () => {
  const trailer: VehicleContext = { source: "garage", label: "Schmitz", shortLabel: "Schmitz", kind: "TRAILER", makeId: "schmitz", axleBrand: "BPW", oeNumbers: [] };
  assert.equal(evaluateFit(product([rule({ axleBrand: "BPW" })]), trailer).status, "fits");
  assert.equal(evaluateFit(product([rule({ axleBrand: "SAF" })]), trailer).status, "no");
});

test("універсальний товар і товар без даних", () => {
  assert.equal(evaluateFit(product([], { isUniversal: true }), daf).status, "fits");
  assert.equal(evaluateFit(product([]), daf).status, "maybe");
});

test("порівняння номерів шасі", () => {
  assert.ok(compareChassis("9999", "10000") < 0);
  assert.ok(compareChassis("E-512345", "E 500000") > 0);
});
