/**
 * Tarjeta "fantasma" con brillo que se muestra mientras cargan los productos.
 * Reemplaza al texto "Cargando..." y hace que la espera se sienta más rápida.
 */
export default function ProductCardSkeleton() {
  return (
    <div
      className="rounded-2xl border border-line bg-white p-2.5 sm:p-3"
      aria-hidden="true"
    >
      <div className="skeleton aspect-square w-full rounded-xl" />

      <div className="mt-3 px-0.5">
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton mt-2.5 h-4 w-5/6 rounded" />
        <div className="skeleton mt-1.5 h-4 w-2/3 rounded" />
        <div className="skeleton mt-4 h-6 w-1/3 rounded" />
        <div className="skeleton mt-4 h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}
