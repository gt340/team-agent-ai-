import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CursorFX from "@/components/CursorFX";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atlas — Your Entire Company, Powered by One AI Team",
  description:
    "Atlas is a unified AI agent team that runs your apps, documents, workflows, and support — one intelligent system connected to everything you already use.",
  metadataBase: new URL("https://atlas.ai"),
  openGraph: {
    title: "Atlas — Your Entire Company, Powered by One AI Team",
    description:
      "One AI team. Every app, every doc, every workflow. Meet Atlas.",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-base-950 text-ink font-body antialiased grain">
        <SmoothScroll />
        <CursorFX />
        {children}
      </body>
    </html>
  );
}
