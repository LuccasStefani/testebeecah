import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";

import { CartProvider } from "@/src/contexts/CartContext";

type StoreLayoutProps = {
  children: React.ReactNode;
};

export default function StoreLayout({
  children,
}: StoreLayoutProps) {
  return (
    <CartProvider>
      <Header />

      <main>{children}</main>

      <Footer />
    </CartProvider>
  );
}