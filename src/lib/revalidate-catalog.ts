import { revalidatePath } from "next/cache";

export function revalidateCatalog() {
  revalidatePath("/(store)", "layout");
}
