export const productImageAccept = "image/jpeg,image/png,image/webp";
export function mergeProductImageFiles(current: File[], incoming: File[]) {
  const key = (file: File) => [file.name, file.size, file.lastModified].join(":");
  const known = new Set(current.map(key));
  const files = [...current];
  let invalid = 0;
  let duplicates = 0;
  for (const file of incoming) {
    if (
      !productImageAccept.split(",").includes(file.type) ||
      file.size <= 0 ||
      file.size > 10 * 1024 * 1024
    ) {
      invalid++;
      continue;
    }
    if (known.has(key(file))) {
      duplicates++;
      continue;
    }
    known.add(key(file));
    files.push(file);
  }
  return { files, invalid, duplicates };
}
