const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const scope = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("src/lib/product-image-files.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  scope,
);
const { mergeProductImageFiles } = scope.exports;
const file = (name, type = "image/jpeg", size = 100) => ({
  name,
  type,
  size,
  lastModified: 1,
});
test("drop appends valid images and preserves the selected cover", () => {
  const cover = file("cover.jpg");
  const result = mergeProductImageFiles(
    [cover],
    [file("second.png", "image/png"), file("third.webp", "image/webp")],
  );
  assert.equal(result.files.length, 3);
  assert.equal(result.files[0], cover);
  assert.equal(result.invalid, 0);
});
test("invalid, empty and oversized files are rejected while valid images remain", () => {
  const result = mergeProductImageFiles(
    [],
    [
      file("doc.svg", "image/svg+xml"),
      file("empty.jpg", "image/jpeg", 0),
      file("large.jpg", "image/jpeg", 10 * 1024 * 1024 + 1),
      file("ok.jpg", "image/jpeg", 10 * 1024 * 1024),
    ],
  );
  assert.equal(result.invalid, 3);
  assert.equal(result.files.length, 1);
});
test("selecting the same image twice does not duplicate the upload", () => {
  const result = mergeProductImageFiles(
    [file("first.jpg")],
    [file("first.jpg"), file("second.jpg"), file("second.jpg")],
  );
  assert.equal(result.duplicates, 2);
  assert.equal(result.files.length, 2);
});
