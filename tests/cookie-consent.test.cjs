const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../src/lib/cookie-consent.ts"), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function setup(blocked = false) {
  const values = new Map();
  const storage = { getItem: key => { if (blocked) throw Error("blocked"); return values.get(key) ?? null; }, setItem: (key, value) => { if (blocked) throw Error("blocked"); values.set(key, value); }, removeItem: key => values.delete(key) };
  const window = new EventTarget();
  const scope = { exports: {}, window, localStorage: storage, sessionStorage: storage, Event, Date };
  vm.runInNewContext(code, scope);
  return { ...scope.exports, values, window };
}
test("analytics defaults to off, including malformed and expired consent", () => {
  const c = setup();
  assert.equal(c.hasAnalyticsConsent(), false);
  for (const value of [null, "bad", "null", JSON.stringify({version:1,analytics:"true",savedAt:Date.now()}), JSON.stringify({version:1,analytics:true,savedAt:Date.now()-181*86400000}), JSON.stringify({version:1,analytics:true,savedAt:Date.now()+86400000})]) assert.equal(c.parseConsent(value), null);
});
test("explicit acceptance can be revoked and removes the click identifier", () => {
  const c = setup(); let calls = 0;
  const unsubscribe = c.subscribeConsent(() => calls++);
  c.saveConsent(true); assert.equal(c.hasAnalyticsConsent(), true);
  c.values.set("beecah:click-session", "test-session");
  c.saveConsent(false); assert.equal(c.hasAnalyticsConsent(), false);
  assert.equal(c.values.has("beecah:click-session"), false); assert.equal(calls, 2);
  unsubscribe(); c.saveConsent(false); assert.equal(calls, 2);
});
test("choice still works when browser storage is unavailable", () => {
  const c = setup(true); c.saveConsent(false); assert.equal(c.parseConsent(c.consentSnapshot()).analytics, false);
  c.saveConsent(true); assert.equal(c.hasAnalyticsConsent(), true);
});

test("product clicks are sent only while optional analytics are allowed", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/components/products/ClickTracking.tsx"), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const listeners = new Map(); let allowed = false; let sent = 0; let cleanup;
  class Element { closest() { return { href: "https://beecah.test/perfumes/yara" }; } }
  const scope = { exports: {}, require: name => name === "react" ? { useEffect: effect => { cleanup = effect(); } } : { hasAnalyticsConsent: () => allowed }, Element, URL, location: { href: "https://beecah.test/", origin: "https://beecah.test" }, document: { addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) }, sessionStorage: { getItem: () => "test", setItem: () => {} }, fetch: () => { sent++; return Promise.resolve(); } };
  vm.runInNewContext(output, scope); scope.exports.default();
  const click = { button: 0, target: new Element() };
  listeners.get("click")(click); assert.equal(sent, 0);
  allowed = true; listeners.get("click")(click); assert.equal(sent, 1);
  allowed = false; listeners.get("click")(click); assert.equal(sent, 1);
  cleanup(); assert.equal(listeners.size, 0);
});
