import { createHash } from "node:crypto";
import type { Product } from "@/src/types/product";

/** Includes images and promotions, not only the product updated_at timestamp. */
export function catalogRevision(products: Product[]): string {
  return createHash("sha256")
    .update(JSON.stringify([...products].sort((a, b) => a.id.localeCompare(b.id))))
    .digest("hex");
}
