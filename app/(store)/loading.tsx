import { storeContent } from "@/src/content/store";
export default function Loading() {
  return (
    <section
      role="status"
      aria-label={storeContent.carregandoALoja}
      className="mx-auto max-w-7xl animate-pulse px-6 py-12"
    >
      <div className="h-40 rounded-3xl bg-neutral-100" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-80 rounded-2xl bg-neutral-100" />
        ))}
      </div>
      <span className="sr-only">{storeContent.carregando}</span>
    </section>
  );
}
