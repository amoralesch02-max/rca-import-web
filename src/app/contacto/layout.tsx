import type { ReactNode } from "react";
import { buildMetadata } from "@/lib/site-metadata";

export const metadata = buildMetadata({
  title: "Contacto",
  description: "Escríbenos por WhatsApp o visítanos en Tacna. Atención directa y envíos a todo el Perú.",
  path: "/contacto",
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
