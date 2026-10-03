import { CookiePreferencesButton } from "./CookieConsent";
import FooterVideo from "./FooterVideo";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { ArrowUpRight } from "lucide-react";
import { storeContent } from "@/src/content/store";
import { footerContent, footerGroups } from "@/src/content/footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: "400",
  style: "normal",
  display: "swap",
});

export default function Footer() {
  return (
    <footer className="mt-8 bg-white px-4 pb-6 text-white sm:px-8 sm:pb-8 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-8 [&_a:focus-visible]:outline-white">
      <div className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-[24px] border border-black/10 bg-[#090a0b] sm:rounded-[28px]">
        <div
          className="absolute inset-y-0 left-0 hidden w-[23%] lg:block"
          aria-hidden="true"
        >
          <FooterVideo src={footerContent.video} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#090a0b]/60" />
        </div>
        <div className="relative px-6 py-7 sm:px-8 lg:ml-[23%] lg:flex lg:flex-col lg:gap-5 lg:px-9 lg:py-6">
          <h2
            className={
              playfair.className +
              " text-[clamp(42px,6.5vw,88px)] font-normal leading-[1.02] tracking-[-0.065em]"
            }
          >
            <span className="block">{footerContent.headline[0]}</span>
            <span className="block text-right">{footerContent.headline[1]}</span>
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4 lg:mt-0 lg:shrink-0 lg:gap-x-6">
            <div className="col-span-2 sm:col-span-1 [&>a]:inline-flex [&>a]:items-center [&>a]:gap-2 [&>a]:text-xs [&>a]:leading-6 [&>a:hover]:underline">
              <h3 className="mb-5 lg:mb-3 text-[10px] uppercase tracking-[0.12em] text-white/45">
                {storeContent.atendimento}
              </h3>
              <a href="https://wa.me/5511967640418" target="_blank" rel="noreferrer">
                {storeContent.conversePeloWhatsapp}
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
            {footerGroups.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h3 className="mb-5 lg:mb-3 text-[10px] uppercase tracking-[0.12em] text-white/45">
                  {group.title}
                </h3>
                <ul className="space-y-2 lg:space-y-1">
                  {group.links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="inline-block text-xs leading-5 text-white/85 transition-colors hover:text-white hover:underline hover:underline-offset-4"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <Link
            href="/"
            aria-label={storeContent.beecahCollectionInicio}
            className="mt-7 inline-block lg:mt-0 lg:shrink-0 lg:self-start"
          >
            <Image
              src="/images/logo/LogoMain.svg"
              alt={storeContent.beecahCollection}
              width={165}
              height={97}
              className="h-auto w-36 brightness-0 invert sm:w-40 lg:w-32"
            />
          </Link>
          <div className="mt-7 flex flex-col gap-5 lg:mt-0 lg:shrink-0 text-[10px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()}
              {storeContent.beecahCollection2}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <Link href="/politica-de-privacidade" className="hover:text-white">
                {storeContent.privacidade}
              </Link>
              <CookiePreferencesButton />
              <Link href="/termos" className="hover:text-white">
                {storeContent.termosDeUso}
              </Link>
              <a href="#conteudo" className="hover:text-white">
                {storeContent.voltarAoTopo}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
