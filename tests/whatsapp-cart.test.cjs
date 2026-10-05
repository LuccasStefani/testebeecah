const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, imports = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const scope = {
    exports: {},
    console,
    require: (id) => {
      if (imports[id]) return imports[id];
      if (id.startsWith("@/")) return load(id.slice(2) + ".ts", imports);
      throw Error("Unexpected import: " + id);
    },
  };
  vm.runInNewContext(code, scope);
  return scope.exports;
}

const { buildCartWhatsAppUrl } = load("src/lib/whatsapp-cart.ts");

test("empty cart has no WhatsApp link", () => {
  assert.equal(buildCartWhatsAppUrl([]), null);
});

test("message encodes accents, quantities, totals and special characters", () => {
  const url = new URL(
    buildCartWhatsAppUrl([
      { name: "Lc & Rebecca #1", price: 480, quantity: 2, stock: 3 },
      { name: "Árabe", price: 100, quantity: 1, stock: 1 },
    ]),
  );
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/5511967640418");
  const text = url.searchParams.get("text").replace(/\u00a0/g, " ");
  assert.ok(text.includes("2 × Lc & Rebecca #1 — R$ 960,00"));
  assert.ok(text.includes("1 × Árabe — R$ 100,00"));
  assert.ok(text.includes("Subtotal dos produtos: R$ 1.060,00"));
  assert.ok(text.includes("Frete e disponibilidade a confirmar"));
});

test("quantity updates regenerate the message and unavailable stock is marked", () => {
  const item = { name: "Perfume", price: 25, quantity: 1, stock: 1 };
  const first = buildCartWhatsAppUrl([item]);
  const second = buildCartWhatsAppUrl([{ ...item, quantity: 2 }]);
  assert.notEqual(first, second);
  assert.ok(new URL(second).searchParams.get("text").includes("consultar a loja"));
});
