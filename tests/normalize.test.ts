import { test } from "node:test";
import assert from "node:assert/strict";
import { looksLikeVin, normalize, slugify } from "../src/lib/normalize";

test("normalize прибирає пробіли, дефіси, крапки і підносить регістр", () => {
  assert.equal(normalize("hu 1381/3 x"), "HU13813X");
  assert.equal(normalize("81.50820-6075"), "81508206075");
  assert.equal(normalize(null), "");
});

test("looksLikeVin: 17 символів без I/O/Q", () => {
  assert.ok(looksLikeVin("XLRTEH439GE512345"));
  assert.ok(looksLikeVin("xlr teh439 ge512345"));
  assert.ok(!looksLikeVin("XLRTEH439GE51234"));
  assert.ok(!looksLikeVin("XLRTEH439GE5123O5"));
});

test("slugify транслітерує українську", () => {
  assert.equal(slugify("Фільтр оливний DAF XF 106"), "filtr-olyvnyi-daf-xf-106");
});
