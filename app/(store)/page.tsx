import Link from "next/link";

const categories = [
  {
    name: "Perfumes Femininos",
    href: "/categorias/feminino",
  },
  {
    name: "Perfumes Masculinos",
    href: "/categorias/masculino",
  },
  {
    name: "Perfumes Árabes",
    href: "/categorias/arabes",
  },
  {
    name: "Promoções",
    href: "/categorias/promocoes",
  },
];

export default function Home() {
  return (
    <>
      <section className="bg-neutral-100">
        <div className="mx-auto grid min-h-[520px] max-w-7xl items-center px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">
              Beecah Perfumes
            </span>

            <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Encontre uma fragrância para chamar de sua.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-neutral-600">
              Descubra perfumes femininos, masculinos, árabes e importados
              cuidadosamente selecionados.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/perfumes"
                className="bg-neutral-950 px-7 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Ver perfumes
              </Link>

              <Link
                href="/categorias/promocoes"
                className="border border-neutral-300 bg-white px-7 py-3.5 text-sm font-medium transition hover:bg-neutral-50"
              >
                Ver promoções
              </Link>
            </div>
          </div>

          <div className="mt-12 flex min-h-[350px] items-center justify-center border border-dashed border-neutral-300 bg-neutral-200/40 lg:mt-0">
            <span className="text-sm text-neutral-500">
              Banner principal entra aqui
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
            Categorias
          </span>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Encontre seu perfume
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group flex min-h-48 items-end bg-neutral-100 p-6 transition hover:bg-neutral-200"
            >
              <h3 className="text-lg font-medium transition group-hover:translate-x-1">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <span className="text-sm uppercase tracking-[0.2em] text-neutral-400">
            Beecah
          </span>

          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Seu próximo perfume favorito pode estar aqui.
          </h2>

          <Link
            href="/perfumes"
            className="mt-8 inline-block bg-white px-7 py-3.5 text-sm font-medium text-black transition hover:bg-neutral-200"
          >
            Explorar catálogo
          </Link>
        </div>
      </section>
    </>
  );
}