import type { ReactNode } from "react";
import { buildMetadata } from "@/lib/site-metadata";

export const metadata = buildMetadata({
  title: "Catálogo",
  description: "iPhones, accesorios, cables, cubos y más. Nuevos y seminuevos, con envíos a todo el Perú y pedidos por WhatsApp.",
  path: "/catalogo",
});

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return children;
}
