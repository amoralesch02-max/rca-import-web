/**
 * Ilustración de bolsa de compras con los colores de RCA.
 * Se usa en el tema normal (carrito vacío y página 404); en Navidad la
 * reemplaza el duende. Flota suave con la clase .float-soft (globals.css).
 */
export default function ShoppingBagArt({
  className = "",
  question = false,
}: {
  className?: string;
  /** true = muestra un signo "?" en la bolsa (página no encontrada) */
  question?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      className={`float-soft ${className}`}
    >
      {/* sombra en el piso */}
      <ellipse className="float-shadow" cx="60" cy="112" rx="30" ry="4" fill="#0f172a" opacity=".12" />

      {/* asas */}
      <path d="M44 40 V32 a16 16 0 0 1 32 0 V40" fill="none" stroke="#003f7a" strokeWidth="5" strokeLinecap="round" />

      {/* bolsa */}
      <path d="M26 38 H94 L100 100 a6 6 0 0 1 -6 6.6 H26 a6 6 0 0 1 -6 -6.6 Z" fill="#0057a8" />
      <path d="M26 38 H60 V106.6 H26 a6 6 0 0 1 -6 -6.6 Z" fill="#0b67c2" />
      <path d="M26 38 H94 L94.6 44 H25.4 Z" fill="#003f7a" opacity=".5" />

      {/* argollas */}
      <circle cx="44" cy="46" r="3" fill="#e6effa" />
      <circle cx="76" cy="46" r="3" fill="#e6effa" />

      {/* etiqueta roja */}
      <g transform="rotate(-8 78 74)">
        <rect x="64" y="64" width="28" height="18" rx="4" fill="#e31b23" />
        <circle cx="69" cy="73" r="2" fill="#fff" />
        <rect x="74" y="70.5" width="13" height="2.4" rx="1.2" fill="#fff" opacity=".9" />
        <rect x="74" y="75" width="9" height="2.4" rx="1.2" fill="#fff" opacity=".7" />
      </g>

      {question ? (
        <text x="44" y="88" textAnchor="middle" fontSize="34" fontWeight="800" fontFamily="Inter, Arial, sans-serif" fill="#ffffff">?</text>
      ) : (
        <path d="M34 78 q10 10 20 0" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      )}

      {/* destellos */}
      <path className="tw a" d="M104 22 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" fill="#facc15" />
      <path className="tw b" d="M14 56 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z" fill="#38bdf8" />
    </svg>
  );
}
