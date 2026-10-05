const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, imports = {}) {
  const code = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const scope = {
    exports: {},
    process: {
      env: {
        NEXT_PUBLIC_SITE_URL: "https://beecah.test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test-secret",
      },
    },
    console,
    URL,
    require: (id) => {
      if (imports[id]) return imports[id];
      if (id.startsWith("@/")) return load(id.slice(2) + ".ts", imports);
      throw Error("Unexpected import: " + id);
    },
  };
  vm.runInNewContext(code, scope);
  return scope.exports;
}
const { orderPhase, orderWhatsAppUrl } = load("src/lib/assisted-order.ts");
const { getLoginReturnPath } = load("src/lib/login-return.ts");
test("only persisted approved status renders thank you, regardless of expiry or payment URL", () => {
  assert.equal(orderPhase("pending", false, false), "waiting");
  assert.equal(orderPhase("pending", true, false), "ready");
  assert.equal(orderPhase("pending", true, true), "terminal");
  for (const status of ["rejected", "cancelled", "refunded", "expired"])
    assert.equal(orderPhase(status, true, false), "terminal");
  assert.equal(orderPhase("approved", false, true), "paid");
});
test("WhatsApp includes a saved order reference and encoded item snapshot", () => {
  const url = new URL(
    orderWhatsAppUrl({
      id: "abcdef12-1234-1234-1234-123456789abc",
      subtotal: 960,
      order_items: [{ product_name: "Lc & Rebecca\n", quantity: 2, subtotal: 960 }],
    }),
  );
  assert.equal(url.hostname, "wa.me");
  const message = url.searchParams.get("text");
  assert.match(message, /#ABCDEF12/);
  assert.match(message, /2 × Lc & Rebecca/);
  assert.match(message, /Frete a combinar/);
  assert.match(message, /abcdef12-1234-1234-1234-123456789abc/);
});
test("login accepts only known internal destinations", () => {
  assert.equal(getLoginReturnPath("/carrinho"), "/carrinho");
  const receipt = "/checkout/pedido/abcdef12-1234-1234-1234-123456789abc";
  assert.equal(getLoginReturnPath(receipt), receipt);
  for (const input of [
    "https://evil.test",
    "//evil.test",
    "/admin",
    receipt + "?redirect=https://evil.test",
    null,
  ])
    assert.equal(getLoginReturnPath(input), "/auth/continue");
});
function checkoutRoute(user, rpc) {
  return load("app/api/checkout/whatsapp/route.ts", {
    "next/server": {
      NextResponse: { json: (body, init = {}) => ({ body, status: init.status || 200 }) },
    },
    "@/src/lib/supabase/server": {
      createSupabaseServerClient: async () => ({
        auth: { getUser: async () => ({ data: { user } }) },
      }),
    },
    "@/src/lib/supabase/admin": {
      supabaseAdmin: {
        rpc,
        from: () => {
          const query = {
            select: () => query,
            eq: () => query,
            single: async () => ({
              data: {
                id: "saved-order",
                subtotal: 10,
                order_items: [{ product_name: "Perfume", quantity: 1, subtotal: 10 }],
              },
            }),
          };
          return query;
        },
      },
    },
  });
}
const request = (origin) => ({
  url: "https://beecah.test/api/checkout/whatsapp",
  headers: { get: () => origin },
});
test("order API rejects cross-site and unauthenticated creation", async () => {
  let calls = 0;
  const { POST } = checkoutRoute(null, () => {
    calls++;
  });
  assert.equal((await POST(request("https://evil.test"))).status, 403);
  assert.equal((await POST(request("https://beecah.test"))).status, 401);
  assert.equal(calls, 0);
});
test("order API uses the authenticated identity, not client prices or user ID", async () => {
  let passed;
  const { POST } = checkoutRoute({ id: "verified-user" }, async (name, args) => {
    passed = { name, args };
    return { data: "saved-order" };
  });
  const response = await POST(request("https://beecah.test"));
  assert.equal(response.status, 200);
  assert.equal(response.body.orderId, "saved-order");
  assert.equal(new URL(response.body.whatsappUrl).hostname, "wa.me");
  assert.equal(passed.args.p_user_id, "verified-user");
});

function queryQueue(responses, writes = []) {
  return {
    from(table) {
      const result = responses.shift();
      if (!result) throw Error("Unexpected query to " + table);
      const query = new Proxy(
        {},
        {
          get(_target, key) {
            if (key === "then")
              return (resolve, reject) => Promise.resolve(result).then(resolve, reject);
            if (key === "single" || key === "maybeSingle") return async () => result;
            return (...args) => {
              if (key === "update") writes.push(args[0]);
              return query;
            };
          },
        },
      );
      return query;
    },
  };
}
const paymentOrder = {
  id: "order-1",
  user_id: "user-1",
  status: "pending",
  subtotal: 100,
  total: 100,
  shipping_price: null,
  checkout_channel: "whatsapp",
  checkout_shipping_locked: false,
  checkout_payment_url: null,
  expires_at: "2099-01-01T00:00:00Z",
  order_items: [
    { product_id: "p1", product_name: "Perfume", unit_price: 50, quantity: 2 },
  ],
};
function adminRoute({
  authorized = true,
  responses = [],
  writes = [],
  paymentCalls = [],
} = {}) {
  class Preference {
    async search() {
      return { elements: [] };
    }
    async create(value) {
      paymentCalls.push(value);
      return {
        id: "pref-1",
        init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1",
      };
    }
  }
  return load("app/api/admin/orders/[id]/payment/route.ts", {
    "next/server": {
      NextResponse: { json: (body, init = {}) => ({ body, status: init.status || 200 }) },
    },
    mercadopago: { Preference },
    "@/src/lib/auth/require-admin": {
      requireAdmin: async () => ({ authorized, status: 403, message: "Forbidden" }),
    },
    "@/src/lib/supabase/admin": { supabaseAdmin: queryQueue(responses, writes) },
    "@/src/lib/mercadopago/client": { mercadoPagoClient: {} },
  });
}
const paymentRequest = (body) => ({
  ...request("https://beecah.test"),
  json: async () => body,
});
test("payment release rejects non-admin access and invalid delivery amounts", async () => {
  const params = { params: Promise.resolve({ id: "order-1" }) };
  assert.equal(
    (await adminRoute({ authorized: false }).POST(paymentRequest({}), params)).status,
    403,
  );
  for (const body of [
    { shippingPrice: -1, deliveryConfirmed: true },
    { shippingPrice: 10.001, deliveryConfirmed: true },
    { shippingPrice: 0, deliveryConfirmed: false },
    { shippingPrice: "10", deliveryConfirmed: true },
  ])
    assert.equal((await adminRoute().POST(paymentRequest(body), params)).status, 400);
});
test("payment creation uses saved prices, agreed freight, reference and return URL", async () => {
  const writes = [],
    paymentCalls = [];
  const route = adminRoute({
    writes,
    paymentCalls,
    responses: [
      { data: paymentOrder },
      { data: [{ id: "p1", active: true, stock: 2 }] },
      { data: { id: "order-1", total: 112, expires_at: "2099-01-01T00:00:00Z" } },
      { error: null },
    ],
  });
  const response = await route.POST(
    paymentRequest({ shippingPrice: 12, deliveryConfirmed: true, total: 1 }),
    { params: Promise.resolve({ id: "order-1" }) },
  );
  assert.equal(response.status, 200);
  assert.equal(writes[0].total, 112);
  assert.equal(paymentCalls[0].body.external_reference, "order-1");
  assert.equal(paymentCalls[0].body.items[0].unit_price, 50);
  assert.equal(paymentCalls[0].body.items[1].unit_price, 12);
  assert.equal(
    paymentCalls[0].body.back_urls.success,
    "https://beecah.test/checkout/pedido/order-1",
  );
  assert.equal(paymentCalls[0].requestOptions.idempotencyKey, "order-1");
});
test("payment cannot be recreated for an approved order or occupied preparation lock", async () => {
  const params = { params: Promise.resolve({ id: "order-1" }) };
  let paymentCalls = [];
  let route = adminRoute({
    paymentCalls,
    responses: [{ data: { ...paymentOrder, status: "approved" } }],
  });
  assert.equal(
    (
      await route.POST(
        paymentRequest({ shippingPrice: 0, deliveryConfirmed: true }),
        params,
      )
    ).status,
    409,
  );
  route = adminRoute({
    paymentCalls,
    responses: [
      { data: paymentOrder },
      { data: [{ id: "p1", active: true, stock: 2 }] },
      { data: null },
    ],
  });
  assert.equal(
    (
      await route.POST(
        paymentRequest({ shippingPrice: 0, deliveryConfirmed: true }),
        params,
      )
    ).status,
    409,
  );
  assert.equal(paymentCalls.length, 0);
});

function webhookRoute(payment, order, calls) {
  class InvalidWebhookSignatureError extends Error {}
  const database = queryQueue(
    [{ data: order }, { error: null }, { error: null }],
    calls.writes,
  );
  database.rpc = async () => {
    calls.stock++;
    return { data: true };
  };
  return load("app/api/mercadopago/webhook/route.ts", {
    "next/server": {
      NextResponse: { json: (body, init = {}) => ({ body, status: init.status || 200 }) },
    },
    mercadopago: {
      InvalidWebhookSignatureError,
      WebhookSignatureValidator: { validate: () => {} },
      Payment: class {
        async get() {
          return payment;
        }
      },
    },
    "@/src/lib/mercadopago/client": { mercadoPagoClient: {} },
    "@/src/lib/supabase/admin": { supabaseAdmin: database },
  });
}
const notificationRequest = {
  url: "https://beecah.test/api/mercadopago/webhook?data.id=42",
  headers: { get: () => "signed-test-value" },
  json: async () => ({ type: "payment", data: { id: "42" } }),
};
test("webhook rejects a mismatched amount before stock or paid status changes", async () => {
  const calls = { stock: 0, writes: [] };
  const { POST } = webhookRoute(
    {
      id: 42,
      status: "approved",
      external_reference: "order-1",
      currency_id: "BRL",
      transaction_amount: 1,
    },
    { ...paymentOrder, created_at: "2026-01-01", stock_processed_at: null },
    calls,
  );
  assert.equal((await POST(notificationRequest)).status, 409);
  assert.equal(calls.stock, 0);
  assert.equal(calls.writes.length, 0);
});
test("approved notification processes stock and stores the verified payment status", async () => {
  const calls = { stock: 0, writes: [] };
  const { POST } = webhookRoute(
    {
      id: 42,
      status: "approved",
      external_reference: "order-1",
      currency_id: "BRL",
      transaction_amount: 100,
    },
    { ...paymentOrder, created_at: "2026-01-01", stock_processed_at: null },
    calls,
  );
  assert.equal((await POST(notificationRequest)).status, 200);
  assert.equal(calls.stock, 1);
  assert.equal(calls.writes[0].status, "approved");
  assert.equal(calls.writes[0].mercado_pago_payment_id, "42");
});
test("late pending notifications cannot replace an already approved payment", async () => {
  const calls = { stock: 0, writes: [] };
  const { POST } = webhookRoute(
    {
      id: 42,
      status: "pending",
      external_reference: "order-1",
      currency_id: "BRL",
      transaction_amount: 100,
    },
    {
      ...paymentOrder,
      status: "approved",
      stock_processed_at: "2026-01-01",
      mercado_pago_payment_id: "42",
    },
    calls,
  );
  const response = await POST(notificationRequest);
  assert.equal(response.body.ignored, true);
  assert.equal(calls.stock, 0);
  assert.equal(calls.writes.length, 0);
});
