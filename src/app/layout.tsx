import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { StoreChrome } from "@/components/store-chrome";
import { getSettings } from "@/lib/data";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Originally - Aconchego e protecao pro seu pet",
  description: "Moda, camas e acessorios premium para pets com atendimento pelo WhatsApp.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        <StoreChrome settings={settings}>{children}</StoreChrome>
      </body>
    </html>
  );
}
