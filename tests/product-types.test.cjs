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

const types = load("src/content/product-types.ts");
const { selectCollection } = load("src/lib/product-collections.ts");
const products = [
  { id: "original", category: "Feminino", isArabian: true },
  { id: "splash", productType: "body-splash", category: "Feminino", isNew: true },
  { id: "decant", productType: "decant", category: "Masculino", isArabian: true },
];
const ids = (items) => Array.from(items, (p) => p.id);

test("format collections coexist with gender, Arabian and new selections", () => {
  assert.deepEqual(ids(selectCollection(products, "body-splash")), ["splash"]);
  assert.deepEqual(ids(selectCollection(products, "decantes")), ["decant"]);
  assert.deepEqual(ids(selectCollection(products, "feminino")), ["original", "splash"]);
  assert.deepEqual(ids(selectCollection(products, "arabes")), ["original", "decant"]);
  assert.deepEqual(ids(selectCollection(products, "novos")), ["splash"]);
  assert.deepEqual(
    ids(selectCollection(products, "mais-vendidos", ["decant", "original"])),
    ["decant", "original"],
  );
});

test("legacy products remain perfumes and unknown formats cannot be submitted", () => {
  assert.equal(types.parseProductType(undefined), "perfume");
  for (const invalid of [null, "", "Body Splash", "unknown", {}, 1])
    assert.equal(types.isProductType(invalid), false);
});

function route(method, authorized = true) {
  let payload;
  let calls = 0;
  const chain = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    maybeSingle: async () => ({ data: null }),
    insert(value) {
      payload = value;
      return this;
    },
    update(value) {
      payload = value;
      return this;
    },
    single: async () => ({ data: { id: "test", ...payload }, error: null }),
  };
  const module = load(
    method === "POST"
      ? "app/api/admin/products/route.ts"
      : "app/api/admin/products/[id]/route.ts",
    {
      "@aws-sdk/client-s3": {},
      "@/src/lib/r2/client": {},
      "next/server": {
        NextResponse: {
          json: (data, options) => ({ data, status: options?.status ?? 200 }),
        },
      },
      "@/src/lib/auth/require-admin": {
        requireAdmin: async () => ({ authorized, status: 401, message: "Unauthorized" }),
      },
      "@/src/lib/supabase/admin": {
        supabaseAdmin: {
          from() {
            calls++;
            return chain;
          },
        },
      },
    },
  );
  return {
    run: async (body) =>
      module[method](
        { json: async () => body },
        { params: Promise.resolve({ id: "test" }) },
      ),
    get payload() {
      return payload;
    },
    get calls() {
      return calls;
    },
  };
}
const base = {
  name: "Fragrância",
  brand: "Beecah",
  category: "Feminino",
  price: 80,
  stock: 5,
  active: true,
  isArabian: true,
  isNew: true,
};

test("POST and PATCH save both formats without changing the independent selections", async () => {
  for (const method of ["POST", "PATCH"])
    for (const productType of ["body-splash", "decant"]) {
      const r = route(method);
      const result = await r.run({ ...base, productType });
      assert.equal(result.status, method === "POST" ? 201 : 200);
      assert.equal(r.payload.product_type, productType);
      assert.equal(r.payload.category, "Feminino");
      assert.equal(r.payload.is_arabian, true);
      assert.equal(r.payload.is_new, true);
    }
});

test("PATCH omission preserves saved format; old POST defaults to perfume", async () => {
  const patch = route("PATCH");
  await patch.run(base);
  assert.equal(Object.hasOwn(patch.payload, "product_type"), false);
  const post = route("POST");
  await post.run(base);
  assert.equal(post.payload.product_type, "perfume");
});

test("invalid formats and unauthenticated writes never reach the database", async () => {
  for (const method of ["POST", "PATCH"]) {
    for (const value of ["invalid", null, "", 1]) {
      const r = route(method);
      assert.equal((await r.run({ ...base, productType: value })).status, 400);
      assert.equal(r.calls, 0);
    }
    const r = route(method, false);
    assert.equal((await r.run({ ...base, productType: "decant" })).status, 401);
    assert.equal(r.calls, 0);
  }
});
