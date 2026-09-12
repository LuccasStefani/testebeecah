import { redirect } from "next/navigation";

import { requireAdmin } from "@/src/lib/auth/require-admin";

type NewProductLayoutProps = {
  children: React.ReactNode;
};

export default async function NewProductLayout({
  children,
}: NewProductLayoutProps) {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    redirect("/admin/login");
  }

  return children;
}