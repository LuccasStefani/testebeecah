"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function StoreSecondaryContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/cadastro" || pathname === "/sobre")
    return null;
  return children;
}
