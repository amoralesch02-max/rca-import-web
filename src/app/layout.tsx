import type { Metadata } from "next";
import { Inter } from "next/font/google";
import MotionProvider from "@/components/MotionProvider";
import RouteProgress from "@/components/RouteProgress";
import BlackFridayPopup from "@/components/BlackFridayPopup";
import ChristmasLayer from "@/components/navidad/ChristmasLayer";
import ThemeProvider from "@/components/ThemeProvider";
import { SITE_NAME, buildMetadata, getSiteUrl } from "@/lib/site-metadata";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Aplica el tema de temporada ANTES de que se dibuje la página (evita parpadeos).
// Usa el tema que el navegador recordó de la visita anterior, o la vista previa
// (?tema=navidad). ThemeProvider lo confirma después con los datos reales.
const THEME_SCRIPT = `(function(){try{
var path=location.pathname;
if(path.indexOf("/admin")===0)return;
var valid={navidad:1,"anio-nuevo":1};
var q=new URLSearchParams(location.search).get("tema");
if(q){if(valid[q]){sessionStorage.setItem("rca_theme_preview",q)}else{sessionStorage.removeItem("rca_theme_preview")}}
var t=sessionStorage.getItem("rca_theme_preview")||localStorage.getItem("rca_theme");
if(t&&valid[t])document.documentElement.setAttribute("data-theme",t);
}catch(e){}})();`;

export const metadata: Metadata = {
  // Necesario para que las imágenes de vista previa usen la dirección completa
  metadataBase: new URL(getSiteUrl()),
  ...buildMetadata({
    shareTitle: "RCA IMPORT | Tecnología importada en Perú",
    description:
      "Catálogo oficial de RCA IMPORT. iPhones, accesorios, tecnología, productos importados y ventas al por mayor con envíos a todo el Perú.",
    path: "/",
    canonical: false,
  }),
  title: {
    default: "RCA IMPORT | Tecnología importada en Perú",
    // Las demás páginas: "iPhone 15 Pro | RCA IMPORT"
    template: `%s | ${SITE_NAME}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {/* Barra de carga arriba al cambiar de página */}
        <RouteProgress />
        {/* Pop-up de Black Friday (se activa solo del 27 al 30 de noviembre) */}
        <BlackFridayPopup />
        <MotionProvider>{children}</MotionProvider>
        <ThemeProvider />
        <ChristmasLayer />
      </body>
    </html>
  );
}
