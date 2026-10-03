import { privacyContent } from "@/src/content/privacy";
import { storeContent } from "@/src/content/store";
import Link from "next/link";
import { MessageCircle, Package, Truck, Heart, ShieldCheck } from "lucide-react";
export const metadata = { title: storeContent.atendimento };
const topics = [
  {
    id: "envios",
    title: storeContent.entregaEFrete,
    icon: Truck,
    text: storeContent.oValorEAsOpcoesDeFreteSao,
    href: "/carrinho",
    action: storeContent.irParaMinhaSacola,
  },
  {
    id: "pedidos",
    title: storeContent.acompanheSeuPedido,
    icon: Package,
    text: storeContent.entreNaSuaContaParaConsultarSeusPedidos,
    href: "/minha-conta",
    action: storeContent.acessarMinhaConta,
  },
  {
    id: "trocas",
    title: storeContent.trocasEDevolucoes,
    icon: Heart,
    text: storeContent.paraSolicitarUmaTrocaOuDevolucaoFaleCom,
    href: "https://wa.me/5511967640418",
    action: storeContent.falarSobreMeuPedido,
  },
  {
    id: "privacidade",
    title: storeContent.seusDados,
    icon: ShieldCheck,
    text: storeContent.vocePodeConsultarSeusDadosDeCadastroNa,
    href: "/minha-conta/dados",
    action: storeContent.consultarMeuCadastro,
  },
];
export default function Support() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-3xl bg-[#f2f4f8] p-5 sm:p-12">
        <p className="text-xs uppercase tracking-[0.3em] text-beecah-blue">
          {storeContent.estamosPorAqui}
        </p>
        <h1 className="mt-4 text-4xl sm:text-5xl">
          {storeContent.comoPodemos}
          <span className="font-haerins text-beecah-blue">{storeContent.ajudar}</span>
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-neutral-600">
          {storeContent.escolhaSuaFragranciaTireDuvidasSobreACompra}
        </p>
        <a
          href="https://wa.me/5511967640418"
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-flex items-center gap-3 rounded-xl bg-beecah-black px-6 py-4 text-sm text-white"
        >
          <MessageCircle size={19} />
          {storeContent.conversarNoWhatsapp}
        </a>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {topics.map(({ id, title, icon: Icon, text, href, action }) => (
          <article
            id={id}
            key={id}
            className="scroll-mt-32 rounded-2xl border border-neutral-200 p-7"
          >
            <Icon size={24} className="text-beecah-blue" />
            <h2 className="mt-5 text-xl font-medium">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-600">{text}</p>
            {id === "privacidade" && (
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                {privacyContent.details}
              </p>
            )}
            <Link
              href={href}
              className="mt-5 inline-block text-sm font-medium underline underline-offset-4"
            >
              {action}
              {" →"}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
