import type { ReactNode } from "react";
import { buildMetadata } from "@/lib/site-metadata";

export const metadata = buildMetadata({
  title: "Nosotros",
  description: "Conoce a RCA IMPORT y mira las entregas reales a nuestros clientes en todo el Perú.",
  path: "/nosotros",
});

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
