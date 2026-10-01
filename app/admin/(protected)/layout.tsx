import { adminContent } from "@/src/content/admin";
import { adminStyles } from "@/src/styles/admin";
import Image from "next/image";
import AdminSearch from "@/src/components/admin/AdminSearch";

import AdminNav from "@/src/components/layout/AdminNav";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/src/lib/auth/require-admin";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    redirect("/admin/login");
  }

  return (
    <div className={[adminStyles.adminWorkspace, "admin-dark"].join(" ")}>
      <header className={adminStyles.adminTopbar}>
        <Link href="/admin" className={adminStyles.adminBrand}>
          <Image
            src="/images/beecah-logo-preloader.png"
            alt={adminContent.beecahCollection}
            width={165}
            height={97}
            priority
            unoptimized
          />
          <span>{adminContent.admin}</span>
        </Link>
        <AdminSearch />
        <div className={adminStyles.adminAccount}>
          <span className={adminStyles.adminAccountAvatar} aria-hidden="true">
            {adminContent.b}
          </span>
          <div>
            <strong>{adminContent.administrador}</strong>
            <span>{auth.user.email}</span>
          </div>
          <Link href="/">{adminContent.verLoja}</Link>
        </div>
      </header>

      <div className={adminStyles.adminFrame}>
        <aside className={adminStyles.adminSidebar}>
          <AdminNav />
        </aside>

        <div className={adminStyles.adminMain}>{children}</div>
      </div>
    </div>
  );
}
