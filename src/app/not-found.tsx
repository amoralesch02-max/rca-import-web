import type { Metadata } from "next";
import NotFoundContent from "@/components/NotFoundContent";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

/** Se muestra cuando alguien entra a una dirección que no existe. */
export default function NotFound() {
  return <NotFoundContent />;
}
