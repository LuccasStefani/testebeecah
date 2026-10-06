const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const scope = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("src/lib/promotions.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  scope,
);
const { activePromoPrice, isPromotionDate, formatPromotionDate } = scope.exports;
const product = { price: 100, promo_price: 80, promo_ends_on: "2026-10-11" };
test("offer remains valid throughout its final day in Brasilia, then expires", () => {
  assert.equal(activePromoPrice(product, new Date("2026-10-12T02:59:59.999Z")), 80);
  assert.equal(activePromoPrice(product, new Date("2026-10-12T03:00:00Z")), undefined);
});
test("legacy offers without deadlines remain active", () => {
  assert.equal(activePromoPrice({ ...product, promo_ends_on: null }), 80);
});
test("invalid discounts and deadlines never become active offers", () => {
  for (const promo_price of [null, 100, 120, -1, "invalid"]) {
    assert.equal(
      activePromoPrice({ ...product, promo_price, promo_ends_on: null }),
      undefined,
    );
  }
  assert.equal(activePromoPrice({ ...product, promo_ends_on: "2026-02-30" }), undefined);
});
test("date validation rejects overflow and displays Brazilian dates", () => {
  for (const value of ["2026-02-29", "2026-04-31", "2026-13-01", "11/10/2026", {}, false])
    assert.equal(isPromotionDate(value), false);
  assert.equal(isPromotionDate("2028-02-29"), true);
  assert.equal(formatPromotionDate("2026-10-11"), "11/10/2026");
});
