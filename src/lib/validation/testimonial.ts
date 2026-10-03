export function parseTestimonial(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (
    typeof input.author !== "string" ||
    typeof input.text !== "string" ||
    typeof input.instagram !== "string" ||
    input.consent !== true
  )
    return null;
  const author = input.author.trim();
  const text = input.text.trim();
  const instagram = input.instagram.trim().replace(/^@/, "");
  if (
    author.length < 2 ||
    author.length > 80 ||
    text.length < 20 ||
    text.length > 1000 ||
    (instagram && !/^[A-Za-z0-9_][A-Za-z0-9_.]{0,29}$/.test(instagram))
  )
    return null;
  return { author, body: text, instagram: instagram || null };
}
