import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

const root = process.cwd();
async function sourceFiles(folder) {
  const entries = await fs.readdir(folder, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) => {
      const file = path.join(folder, entry.name);
      return entry.isDirectory()
        ? sourceFiles(file)
        : /\.(tsx?|css)$/.test(file)
          ? [file]
          : [];
    }),
  );
  return groups.flat();
}
const files = [
  ...(await sourceFiles(path.join(root, "src"))),
  ...(await sourceFiles(path.join(root, "app"))),
];
const sources = await Promise.all(
  files.map(async (file) => ({ file, text: await fs.readFile(file, "utf8") })),
);
const urls = new Set(
  sources.flatMap(({ text }) =>
    [...text.matchAll(/\/images\/banners\/[^"'`\r\n]+\.(?:jpg|jpeg|png)/g)].map(
      (match) => match[0],
    ),
  ),
);
await fs.mkdir(path.join(root, "public/images/optimized"), { recursive: true });
const replacements = new Map();
let before = 0,
  after = 0;
for (const url of urls) {
  const input = path.join(root, "public", url);
  let bytes;
  try {
    bytes = await fs.readFile(input);
  } catch {
    console.log("Missing asset (unchanged): " + url);
    continue;
  }
  const output = await sharp(bytes)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
  if (output.length >= bytes.length) continue;
  const hash = createHash("sha256").update(output).digest("hex").slice(0, 10);
  const basename = path.basename(url, path.extname(url)).replace(/[^a-zA-Z0-9-]/g, "-");
  const target = "/images/optimized/" + basename + "-" + hash + ".webp";
  await fs.writeFile(path.join(root, "public", target), output);
  replacements.set(url, target);
  before += bytes.length;
  after += output.length;
  console.log(
    JSON.stringify({ source: url, target, before: bytes.length, after: output.length }),
  );
}
for (const { file, text } of sources) {
  let updated = text;
  for (const [from, to] of replacements) updated = updated.split(from).join(to);
  if (updated !== text) await fs.writeFile(file, updated);
}
console.log(
  JSON.stringify({
    optimized: replacements.size,
    before,
    after,
    savedPercent: Math.round((1 - after / before) * 100),
  }),
);
