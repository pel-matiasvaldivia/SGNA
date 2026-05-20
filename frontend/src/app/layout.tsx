import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Auditorías en Línea | Software SGI y Normativas ISO",
  description: "La forma más rápida y eficiente de alcanzar la Excelencia. Soluciones ágiles de auditorías, gestión de riesgos ISO 9001/14001/45001 y automatización corporativa.",
  keywords: ["Auditoría", "SGI", "ISO 9001", "ISO 14001", "ISO 45001", "Software de Gestión", "Huella de Carbono", "Multitenant"],
  openGraph: {
    title: "Auditorías en Línea | Excelencia en Gestión",
    description: "Sistemas de Gestión Integrado Inteligente y Analítica en tiempo real.",
    url: "https://auditoriasenlinea.com.ar",
    siteName: "Auditorías en Línea",
    locale: "es_AR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-muted/20`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
