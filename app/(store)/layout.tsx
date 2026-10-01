import { storeContent } from "@/src/content/store";
import StorePreloader from "@/src/components/layout/StorePreloader";
import PromotionPopupServer from "@/src/components/layout/PromotionPopupServer";
import ClickTracking from "@/src/components/products/ClickTracking";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";

import { CartProvider } from "@/src/contexts/CartContext";

type StoreLayoutProps = {
  children: React.ReactNode;
};

export default function StoreLayout({ children }: StoreLayoutProps) {
  return (
    <CartProvider>
      <StorePreloader />
      <ClickTracking />
      <a
        href="#conteudo"
        className={[
          "fixed -top-[100px] left-4 z-100 rounded-xl bg-white px-5 py-3 text-beecah-black focus:top-3",
        ].join(" ")}
      >
        {storeContent.pularParaOConteudo}
      </a>
      <Header />

      <main
        id="conteudo"
        className={[
          "storefront pt-24 [&_input:not([type=checkbox]):not([type=radio]):not([type=file])]:rounded-xl [&_select]:rounded-xl [&_textarea]:rounded-xl [&_button[type=submit]]:rounded-xl max-sm:[&_input]:text-base max-sm:[&_select]:text-base max-sm:[&_textarea]:text-base",
          "pt-24",
        ].join(" ")}
        tabIndex={-1}
      >
        {children}
      </main>

      <Footer />
      <PromotionPopupServer />
    </CartProvider>
  );
}
