import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-xl font-semibold tracking-wide">BEECAH</h2>

          <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-400">
            Perfumes selecionados para transformar cada momento em uma
            experiência única.
          </p>
        </div>

        <div>
          <h3 className="font-medium">Navegação</h3>

          <div className="mt-4 flex flex-col gap-3 text-sm text-neutral-400">
            <Link href="/perfumes" className="hover:text-white">
              Perfumes
            </Link>

            <Link href="/categorias/feminino" className="hover:text-white">
              Feminino
            </Link>

            <Link href="/categorias/masculino" className="hover:text-white">
              Masculino
            </Link>

            <Link href="/favoritos" className="hover:text-white">
              Favoritos
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-medium">Atendimento</h3>

          <div className="mt-4 flex flex-col gap-3 text-sm text-neutral-400">
            <span>Segunda a sábado</span>
            <span>09:00 às 18:00</span>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-800 py-5 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Beecah. Todos os direitos reservados.
      </div>
    </footer>
  );
}