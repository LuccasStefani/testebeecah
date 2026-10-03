const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../src/lib/validation/testimonial.ts"), "utf8");
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const scope = { exports: {} };
vm.runInNewContext(output, scope);
const { parseTestimonial } = scope.exports;
const valid = { author: " Ana Silva ", text: " Gostei de conhecer as fragrâncias da coleção. ", instagram: " @ana.silva ", consent: true };

test("normalizes public display fields", () => {
  const parsed = parseTestimonial(valid);
  assert.equal(parsed.author, "Ana Silva");
  assert.equal(parsed.instagram, "ana.silva");
  assert.equal(parsed.body, valid.text.trim());
});
test("accepts optional Instagram", () => assert.equal(parseTestimonial({ ...valid, instagram: "" }).instagram, null));
test("requires explicit publication consent", () => {
  for (const consent of [false, undefined, "true", 1]) assert.equal(parseTestimonial({ ...valid, consent }), null);
});
test("rejects invalid text, names and handles", () => {
  for (const fields of [{ author: " " }, { author: "a".repeat(81) }, { text: "curto" }, { text: "x".repeat(1001) }, { instagram: "https://instagram.com/name" }, { instagram: "bad handle" }, { instagram: "x".repeat(31) }, { text: 42 }]) assert.equal(parseTestimonial({ ...valid, ...fields }), null);
});
test("does not trust status or ownership supplied by the browser", () => {
  const parsed = parseTestimonial({ ...valid, status: "approved", user_id: "another-user" });
  assert.equal(parsed.status, undefined);
  assert.equal(parsed.user_id, undefined);
});
