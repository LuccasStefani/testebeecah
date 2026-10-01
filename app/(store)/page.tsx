import { storeContent } from "@/src/content/store";
import { homeStyles } from "@/src/styles/home";
import HomeTestimonials from "@/src/components/layout/HomeTestimonials";
import Bento from "@/src/components/layout/Bento";

import BrandSlide from "@/src/components/layout/BrandSlide";
import Hero from "@/src/components/layout/Hero";
import HomeCollection from "@/src/components/layout/HomeCollection";
import HomeSections from "@/src/components/layout/HomeSections";
import { getCatalog } from "@/src/lib/catalog";

export default async function Home() {
  const { products, failed } = await getCatalog();
  const sortedProducts = [...products].sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
  );

  return (
    <div className={[homeStyles.beecahHome, "mx-auto", "max-w-7xl"].join(" ")}>
      <Hero />
      <div className={homeStyles.homeIntro}>
        <span>{storeContent.umaColecaoMuitasPossibilidades}</span>
        <a href="#colecao">{storeContent.encontreSeuProximoPerfume}</a>
      </div>
      <Bento products={sortedProducts} failed={failed} showProducts={false} />
      <HomeCollection products={sortedProducts} failed={failed} />
      <BrandSlide />
      <HomeTestimonials />
      <HomeSections />
    </div>
  );
}
