import { productTypeContent } from "@/src/content/product-types";
import { catalogContent } from "@/src/content/catalog";
import Link from "next/link";
const links = [
  [catalogContent.todos, "/perfumes"],
  [catalogContent.arabes, "/categorias/arabes"],
  [productTypeContent.collections["body-splash"].title, "/categorias/body-splash"],
  [productTypeContent.collections.decantes.title, "/categorias/decantes"],
  [
    productTypeContent.collections["perfume-de-cabelo"].title,
    "/categorias/perfume-de-cabelo",
  ],
  [productTypeContent.collections["creme-corporal"].title, "/categorias/creme-corporal"],
  [
    productTypeContent.collections["creme-para-a-pele"].title,
    "/categorias/creme-para-a-pele",
  ],
  [catalogContent.femininos, "/categorias/feminino"],
  [catalogContent.masculinos, "/categorias/masculino"],
  [catalogContent.novos, "/categorias/novos"],
  [catalogContent.maisVendidos, "/categorias/mais-vendidos"],
];
export default function CollectionLinks({ current = "/perfumes" }: { current?: string }) {
  return (
    <nav
      aria-label={catalogContent.colecoesDePerfumes}
      className="my-7 flex flex-wrap gap-2"
    >
      {links.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          aria-current={current === href ? "page" : undefined}
          className={
            "rounded-full px-4 py-3 text-xs transition " +
            (current === href
              ? "bg-beecah-black text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200")
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
