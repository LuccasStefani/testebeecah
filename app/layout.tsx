import type { Metadata } from "next";
import "./globals.css";

import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";

import { CartProvider } from "@/src/contexts/CartContext";

export const metadata: Metadata = {
  title: {
    default: "Beecah Perfumes",
    template: "%s | Beecah",
  },
  description:
    "Perfumes importados, árabes, femininos e masculinos selecionados pela Beecah.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <CartProvider>
          <Header />

          <main>{children}</main>

          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
