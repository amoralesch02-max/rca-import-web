/**
 * Transición suave al cambiar de página: cada página nueva aparece con un
 * leve desvanecido. Solo usa opacidad (no movimiento) para no interferir
 * con el header fijo ni con el carrito lateral.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
