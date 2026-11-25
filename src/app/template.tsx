import type { ReactNode } from "react";

/**
 * Transición suave al cambiar de página: cada página nueva aparece con un
 * leve desvanecido. Solo usa opacidad (no movimiento) para no interferir
 * con el header fijo ni con el carrito lateral.
 * La animación .animate-page-in está en globals.css.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
