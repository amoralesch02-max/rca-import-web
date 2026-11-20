import type { ReactNode } from "react";
import { buildMetadata } from "@/lib/site-metadata";

export const metadata = buildMetadata({
  title: "Carrito",
  description: "Revisa tu pedido y envíalo por WhatsApp a RCA IMPORT.",
  path: "/carrito",
});

export default function CartLayout({ children }: { children: ReactNode }) {
  return children;
}
