import { storeContent } from "@/src/content/store";
import { homeStyles } from "@/src/styles/home";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata = {
  title: storeContent.novidadesEmBreve,
  description: storeContent.acompanheAsProximasNovidadesDaBeecahCollectionE,
};
export default function NewsPage() {
  return (
    <div
      className={[homeStyles.beecahHome, "news-page", "mx-auto", "max-w-7xl"].join(" ")}
    >
      <nav
        className={homeStyles.newsBreadcrumb}
        aria-label={storeContent.navegacaoEstrutural}
      >
        <Link href="/">{storeContent.inicio}</Link>
        <span>{"/"}</span>
        <span aria-current="page">{storeContent.novidades}</span>
      </nav>
      <section className={homeStyles.homeComing} aria-labelledby="news-title">
        <div className={homeStyles.homeComingCopy}>
          <p className="home-eyebrow">{storeContent.beecahNovidades}</p>
          <h1 id="news-title">
            {storeContent.oProximoCapitulo}
            <br />
            <em>{storeContent.aindaVaiChegar}</em>
          </h1>
          <p>{storeContent.emBreveEsteEspacoVaiReunirAsNovidades}</p>
          <p>{storeContent.enquantoIssoDescubraOsPerfumesQueJaFazem}</p>
          <Link href="/perfumes" className="home-button">
            {storeContent.explorarColecao}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className={homeStyles.homeComingImage}>
          <Image
            src="/images/banners/womanbanner.jpg"
            alt={storeContent.universoDeFragranciasBeecah}
            fill
            priority
            sizes="(max-width: 760px) 100vw, 50vw"
            className="object-cover"
          />
          <span>{storeContent.emBreve}</span>
        </div>
      </section>
      <section className={homeStyles.homeContact} aria-labelledby="news-help">
        <div>
          <p className="home-eyebrow">{storeContent.temUmPerfumeEmMente}</p>
          <h2 id="news-help">
            {storeContent.contePara}
            <em>{storeContent.aGente}</em>
          </h2>
        </div>
        <div>
          <p>{storeContent.consulteADisponibilidadeDeUmaFragranciaComNosso}</p>
          <Link href="/atendimento" className="home-button">
            {storeContent.falarComABeecah2}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
