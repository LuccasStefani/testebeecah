import { accountStyles } from "@/src/styles/account";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import AccountNavigation from "@/src/components/account/AccountNavigation";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className={[accountStyles.accountShell].join(" ")}>
      <AccountNavigation />
      <div className={[accountStyles.accountContent].join(" ")}>{children}</div>
    </div>
  );
}
