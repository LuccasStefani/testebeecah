import { storeContent } from "@/src/content/store";
import { footerStyles } from "@/src/styles/footer";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const groups = [
  {
    title: storeContent.explore,
    links: [
      [storeContent.todosOsPerfumes, "/perfumes"],
      [storeContent.femininos, "/categorias/feminino"],
      [storeContent.masculinos, "/categorias/masculino"],
      [storeContent.arabes, "/categorias/arabes"],
      [storeContent.novos, "/categorias/novos"],
      [storeContent.maisVendidos, "/categorias/mais-vendidos"],
      [storeContent.emBreve, "/novidades"],
    ],
  },
  {
    title: storeContent.suaBeecah,
    links: [
      [storeContent.minhaConta, "/minha-conta"],
      [storeContent.meusFavoritos, "/favoritos"],
      [storeContent.minhaSacola, "/carrinho"],
      [storeContent.sobreNos, "/sobre"],
    ],
  },
  {
    title: storeContent.podemosAjudar,
    links: [
      [storeContent.atendimento, "/atendimento"],
      [storeContent.entregaEFrete, "/atendimento#envios"],
      [storeContent.acompanharPedido, "/atendimento#pedidos"],
      [storeContent.trocasEDevolucoes, "/trocas-e-devolucoes"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className={footerStyles.beecahFooter}>
      <div className={footerStyles.footerInner}>
        <div className={footerStyles.footerTop}>
          <div className={footerStyles.footerBrand}>
            <Link href="/" aria-label={storeContent.beecahCollectionInicio}>
              <Image
                src="/images/beecah-logo-preloader.png"
                alt={storeContent.beecahCollection}
                width={165}
                height={97}
              />
            </Link>
            <p>
              {storeContent.fragranciasQueAcompanham}
              <br />
              {storeContent.quemVoceE}
            </p>
            <a href="https://wa.me/5511967640418" target="_blank" rel="noreferrer">
              {storeContent.conversePeloWhatsapp}
              <ArrowUpRight size={16} />
            </a>
          </div>
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2>{group.title}</h2>
              {group.links.map(([label, href]) => (
                <Link href={href} key={href}>
                  {label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className={footerStyles.footerSignature} aria-hidden="true">
          {storeContent.seuPerfumeSuaPresenca}
        </div>
        <div className={footerStyles.footerBottom}>
          <p>
            {"© "}
            {new Date().getFullYear()}
            {storeContent.beecahCollection2}
          </p>
          <div>
            <Link href="/politica-de-privacidade">{storeContent.privacidade}</Link>
            <Link href="/termos">{storeContent.termosDeUso}</Link>
            <a href="#conteudo">{storeContent.voltarAoTopo}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
