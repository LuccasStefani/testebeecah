"use client";

import { testimonialFormContent } from "@/src/content/testimonial-form";
import { storeContent } from "@/src/content/store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Users,
  PanelsTopLeft,
  MessageSquare,
} from "lucide-react";
const links = [
  {
    href: "/admin/comentarios",
    label: testimonialFormContent.adminTitle,
    icon: MessageSquare,
  },
  { href: "/admin", label: storeContent.visaoGeral, icon: LayoutDashboard },
  { href: "/admin/produtos", label: storeContent.produtos, icon: Package },
  { href: "/admin/estoque", label: storeContent.estoque, icon: Boxes },
  { href: "/admin/pedidos", label: storeContent.pedidos, icon: ShoppingBag },
  { href: "/admin/clientes", label: storeContent.clientes, icon: Users },
  { href: "/admin/banners", label: storeContent.banners, icon: PanelsTopLeft },
];
export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label={storeContent.painelAdministrativo}
      className="flex gap-1 overflow-x-auto lg:flex-col"
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              "flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm transition " +
              (active
                ? "bg-beecah-blue text-white"
                : "text-neutral-600 hover:bg-neutral-100")
            }
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
