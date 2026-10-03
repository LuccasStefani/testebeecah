import Hero from "./Hero";
import { getCatalog } from "@/src/lib/catalog";
import {
  personalPageHeroes,
  personalHeroActions,
} from "@/src/content/personal-page-heroes";

export default async function PersonalPageHero({
  page,
}: {
  page: keyof typeof personalPageHeroes;
}) {
  const config = personalPageHeroes[page];
  const { products } = await getCatalog();
  const available = products.filter((product) => product.stock > 0);
  const product =
    available.find((product) => product.slug === "yara-lattafa") ??
    available.find((product) => product.featured) ??
    available[0];
  const href = product ? "/perfumes/" + product.slug : "/perfumes";

  return (
    <Hero
      embedded
      eyebrow={config.eyebrow}
      imageSrc={config.imageSrc}
      primaryHref={href}
      secondaryHref="/perfumes"
      collectionHref={href}
      spotlight={product ? { name: product.name, imageUrl: product.imageUrl } : undefined}
      content={{
        ...personalHeroActions,
        titleFirstLine: config.titleFirstLine,
        titleAccent: config.titleAccent,
        titleSecondLine: "",
        description: config.description,
        primaryAction: product
          ? personalHeroActions.productPrefix + " " + product.name
          : personalHeroActions.primaryAction,
      }}
    />
  );
}
