import { promotionContent } from "@/src/content/promotions";
import HomeBodySplash from "@/src/components/layout/HomeBodySplash";
import { getTestimonials } from "@/src/lib/testimonials";
import HomeMotion from "@/src/components/layout/HomeMotion";
import HomeShowcase from "@/src/components/layout/HomeShowcase";
import { getBestSellerIds } from "@/src/lib/best-sellers";
import { selectCollection } from "@/src/lib/product-collections";
import { storeContent } from "@/src/content/store";
import { homeStyles } from "@/src/styles/home";
import HomeTestimonials from "@/src/components/layout/HomeTestimonials";
import Bento from "@/src/components/layout/Bento";

import BrandSlide from "@/src/components/layout/BrandSlide";
import Hero from "@/src/components/layout/Hero";
import { getCatalog } from "@/src/lib/catalog";

export default async function Home() {
  const [{ products, failed }, ranking, reviews] = await Promise.all([
    getCatalog(),
    getBestSellerIds(),
    getTestimonials(),
  ]);
  const promotionalProducts = products.filter(
    (product) =>
      product.stock > 0 &&
      product.promoPrice !== undefined &&
      product.promoPrice < product.price,
  );
  const bestSellers = selectCollection(products, "mais-vendidos", ranking.ids);
  const sortedProducts = [...products].sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
  );

  return (
    <div
      className={[
        homeStyles.beecahHome,
        "mx-auto w-full min-w-0 overflow-x-clip",
        "max-w-7xl",
      ].join(" ")}
    >
      <HomeMotion>
        <Hero compactMobile />
        <BrandSlide />
        <HomeShowcase
          products={[
            ...bestSellers,
            ...sortedProducts.filter(
              (product) => !bestSellers.some((best) => best.id === product.id),
            ),
          ].slice(0, 6)}
          bestSellerIds={bestSellers.slice(0, 6).map((product) => product.id)}
          failed={failed}
        />
        <div className={homeStyles.homeIntro}>
          <span>{storeContent.umaColecaoMuitasPossibilidades}</span>
          <a href="#colecao">{storeContent.encontreSeuProximoPerfume}</a>
        </div>
        <Bento />
        {promotionalProducts.length > 0 && (
          <HomeShowcase
            products={promotionalProducts}
            bestSellerIds={ranking.ids}
            failed={false}
            validity={
              promotionalProducts.some((product) => product.promoEndsOn)
                ? promotionContent.differentDates
                : undefined
            }
            promotion
          />
        )}
        <HomeBodySplash products={selectCollection(products, "body-splash")} />
      </HomeMotion>

      <HomeTestimonials items={reviews.items} />
    </div>
  );
}
