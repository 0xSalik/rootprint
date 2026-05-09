import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Libre_Baskerville,
  Jost,
  Lora,
  IBM_Plex_Mono,
  Noto_Nastaliq_Urdu,
  Caveat,
} from "next/font/google";

import "./globals.css";
import { SiteNav } from "@/components/site/site-nav";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const baskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-nastaliq",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-handwriting",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hunarmand — The Tacit Knowledge OS for Kashmir's Master Craftsmen",
    template: "%s · Hunarmand",
  },
  description:
    "Hunarmand captures the unwritten — the technique, the memory, the lineage of Kashmir's last living masters — before it is gone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${cormorant.variable} ${baskerville.variable} ${jost.variable} ${lora.variable} ${plexMono.variable} ${nastaliq.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="theme-harud bg-parchment text-ink min-h-full font-body flex flex-col">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
