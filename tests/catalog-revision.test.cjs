const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const source = ts.transpileModule(fs.readFileSync("src/lib/catalog-revision.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exportsObject = {};
vm.runInNewContext(source, { exports: exportsObject, require });
const { catalogRevision } = exportsObject;
const product = { id: "a", price: 100, stock: 3, images: ["one.jpg"], imageUrl: "one.jpg" };

test("unchanged catalog and reordered query results keep the same revision", () => {
  const second = { ...product, id: "b" };
  assert.equal(catalogRevision([product, second]), catalogRevision([second, { ...product }]));
});
test("new, removed and deactivated products change the revision", () => {
  assert.notEqual(catalogRevision([]), catalogRevision([product]));
  assert.notEqual(catalogRevision([product]), catalogRevision([product, { ...product, id: "b" }]));
});
test("prices, stock, promotions and photo-only edits change the revision", () => {
  for (const change of [{ price: 120 }, { stock: 0 }, { promoPrice: 80 }, { images: ["two.jpg"] }, { imageUrl: "two.jpg" }]) {
    assert.notEqual(catalogRevision([product]), catalogRevision([{ ...product, ...change }]));
  }
});
