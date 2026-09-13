import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}