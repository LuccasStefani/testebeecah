import { storeContent } from "@/src/content/store";
import { homeStyles } from "@/src/styles/home";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";

export function HomeCategories() {
  return (
    <section
      aria-label={storeContent.explorePorCategoria}
      className="grid gap-3 px-3 sm:grid-cols-2 sm:gap-4 sm:px-4"
    >
      {[
        {
          title: storeContent.femininos,
          number: "01",
          image: "/images/banners/womanbanner.jpg",
          href: "/perfumes?categoria=Feminino",
          position: "object-center",
        },
        {
          title: storeContent.masculinos,
          number: "02",
          image: "/images/banners/bento3.png",
          href: "/perfumes?categoria=Masculino",
          position: "object-center",
        },
      ].map(({ title, number, image, href, position }) => (
        <Link
          key={title}
          href={href}
          className="group relative block aspect-[5/4] overflow-hidden rounded-2xl bg-neutral-200 sm:aspect-[4/5] lg:aspect-square"
        >
          <Image
            src={image}
            alt={storeContent.colecaoDePerfumes + title.toLowerCase()}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className={
              "object-cover transition-transform duration-700 group-hover:scale-[1.025] " +
              position
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
          <div className="absolute inset-x-6 top-6 flex justify-between text-[10px] uppercase tracking-[0.2em] text-white/80">
            <span>{storeContent.beecahColecao}</span>
            <span>{number}</span>
          </div>
          <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-5 text-white sm:inset-x-8 sm:bottom-8">
            <div>
              <h2 className="text-4xl font-medium tracking-tight lg:text-5xl">{title}</h2>
              <span className="mt-3 inline-block border-b border-white/50 pb-1 text-xs">
                {storeContent.explorarPerfumes}
              </span>
            </div>
            <span className="flex size-12 items-center justify-center rounded-full border border-white/50 transition group-hover:bg-white group-hover:text-black">
              <ArrowUpRight size={21} strokeWidth={1.4} />
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}

export default function HomeSections() {
  return (
    <>
      <section
        aria-labelledby="notes-heading"
        className="mx-3 my-6 grid overflow-hidden rounded-2xl bg-[#202c43] text-white sm:mx-4 lg:grid-cols-2"
      >
        <div className="relative hidden min-h-[480px] lg:block">
          <Image
            src="/images/banners/asadpost.jpg"
            alt={storeContent.detalhesDeUmPerfumeDaColecao}
            fill
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#202c43]/25" />
        </div>
        <div className="px-6 py-9 sm:px-10 sm:py-12 lg:px-12">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            {storeContent.umOutroJeitoDeEscolher}
          </p>
          <h2
            id="notes-heading"
            className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl"
          >
            {storeContent.comecePelasNotas}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
            {storeContent.exploreOCatalogoPeloTipoDeFragranciaQue}
          </p>
          <div className="mt-8 border-t border-white/20">
            {[
              {
                label: storeContent.florais,
                detail: storeContent.floresEDelicadeza,
                q: "floral",
              },
              {
                label: storeContent.amadeirados,
                detail: storeContent.madeirasEEspeciarias,
                q: "amadeir",
              },
              {
                label: storeContent.adocicados,
                detail: storeContent.notasDocesEEnvolventes,
                q: "doce",
              },
              {
                label: storeContent.frescos,
                detail: storeContent.levesEVibrantes,
                q: "fresc",
              },
            ].map(({ label, detail, q }) => (
              <Link
                key={q}
                href={"/perfumes?q=" + q}
                className="group flex items-center justify-between gap-3 border-b border-white/20 py-4 transition hover:pl-2"
              >
                <span className="text-base">{label}</span>
                <span className="ml-auto hidden text-[11px] text-white/45 sm:inline">
                  {detail}
                </span>
                <ArrowUpRight size={18} className="ml-3 text-white/70" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="beecah-heading"
        className="grid items-start gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-24 lg:py-20"
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            {storeContent.sobreNosPorRebecaHelen}
          </p>
          <h2
            id="beecah-heading"
            className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl"
          >
            {storeContent.perfumes2}
            <br />
            <span className="font-haerins font-normal text-beecah-blue">
              {storeContent.ePersonalidade}
            </span>
          </h2>
        </div>
        <div className="max-w-lg lg:pt-7">
          <p className="text-base leading-8 text-neutral-600">
            {storeContent.arabesImportadosFragranciasParaODiaADia}
          </p>
          <p className="mt-4 text-sm leading-7 text-neutral-500">
            {storeContent.confiraAsNotasDeCadaPerfumeOuConverse}
          </p>
          <div className="mt-7 flex flex-wrap gap-x-8 gap-y-4">
            <Link
              href="/sobre"
              className="inline-flex items-center gap-4 border-b border-black pb-2 text-xs"
            >
              {storeContent.conhecaABeecah}
              <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/atendimento"
              className="inline-flex items-center gap-4 border-b border-neutral-300 pb-2 text-xs"
            >
              {storeContent.faleComAGente}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className={homeStyles.homeComing} aria-labelledby="coming-heading">
        <div className={homeStyles.homeComingCopy}>
          <p className="home-eyebrow">{storeContent.oProximoCapitulo}</p>
          <h2 id="coming-heading">
            {storeContent.novasDescobertas}
            <br />
            <em>{storeContent.emBrevePorAqui}</em>
          </h2>
          <p>{storeContent.haSempreUmaNovaFragranciaParaConhecerEste}</p>
          <Link className="home-button" href="/novidades">
            {storeContent.acompanharNovidades}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className={homeStyles.homeComingImage}>
          <Image
            src="/images/banners/womanbanner.jpg"
            alt={storeContent.universoDaColecaoBeecah}
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
            className="object-cover"
          />
          <span>{storeContent.novidadesEmBreve}</span>
        </div>
      </section>

      <section
        aria-labelledby="faq-heading"
        className="mx-4 grid gap-7 border-t border-neutral-200 py-12 sm:mx-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16"
      >
        <div>
          <h2 id="faq-heading" className="text-2xl font-medium tracking-tight">
            {storeContent.antesDeFinalizar}
          </h2>
          <Link
            href="/atendimento"
            className="mt-3 inline-block text-xs text-neutral-500 underline underline-offset-4"
          >
            {storeContent.atendimentoBeecah}
          </Link>
        </div>
        <div>
          {[
            {
              question: storeContent.comoConsultoOFrete,
              answer: storeContent.adicioneSeusPerfumesASacolaEInformeO,
            },
            {
              question: storeContent.ondeFicamMeusFavoritos,
              answer: storeContent.entreNaSuaContaEToqueNoCoracao,
            },
            {
              question: storeContent.comoAcompanhoMeusPedidos,
              answer: storeContent.abraOPainelDaContaEAcesseMeus,
            },
          ].map(({ question, answer }) => (
            <details
              key={question}
              className="group border-b border-neutral-200 first:border-t"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm [&::-webkit-details-marker]:hidden">
                {question}
                <Plus
                  size={17}
                  className="shrink-0 text-neutral-400 transition-transform group-open:rotate-45"
                />
              </summary>
              <p className="pb-5 pr-6 text-sm leading-7 text-neutral-500">{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className={homeStyles.homeContact} aria-labelledby="contact-heading">
        <div>
          <p className="home-eyebrow">{storeContent.contatoEstamosPorAqui}</p>
          <h2 id="contact-heading">
            {storeContent.suaProximaEscolha}
            <br />
            {storeContent.comecaCom}
            <em>{storeContent.umaConversa}</em>
          </h2>
        </div>
        <div>
          <p>{storeContent.umaDuvidaSobreAsNotasUmaAjudaPara}</p>
          <Link href="/atendimento" className="home-button">
            {storeContent.falarComAGente}
            <ArrowUpRight size={18} />
          </Link>
          <Link href="/atendimento#pedidos" className={homeStyles.homeContactSecondary}>
            {storeContent.precisoDeAjudaComUmPedido}
          </Link>
        </div>
      </section>
    </>
  );
}
