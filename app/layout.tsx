import type { Metadata, Viewport } from "next";
import { Figtree, Young_Serif } from "next/font/google";
import "./globals.css";

const display = Young_Serif({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Ooievaarsgok",
  description: "Laat vrienden en familie gokken: wordt het een jongen of een meisje, en hoe gaat de baby heten?",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
