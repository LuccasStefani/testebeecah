import { redirect } from "next/navigation";
import { requireAdmin } from "@/src/lib/auth/require-admin";

// Resolve the destination on the server using the same guard as the admin area.
export default async function ContinueAfterLogin() {
  const auth = await requireAdmin();
  if (auth.authorized) redirect("/admin");
  if (auth.status === 401) redirect("/login");
  redirect("/minha-conta");
}
