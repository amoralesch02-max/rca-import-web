import Image from "next/image";
import { Package } from "lucide-react";

/**
 * Imagen de producto reutilizable (tarjetas, carrusel, carrito, galería).
 *
 * - Pensada para fotos CUADRADAS (ej. 1254 x 1254): llenan todo el marco.
 * - Si alguna foto no es cuadrada, se muestra completa y centrada, y los
 *   lados se rellenan con una versión difuminada de la misma foto,
 *   así nunca quedan bordes vacíos ni deformaciones.
 * - Usa next/image: el navegador descarga una versión del tamaño justo
 *   en lugar del archivo original de 1254 px.
 *
 * Tamaño: por defecto es un cuadrado de ancho completo. Para otro tamaño,
 * pasa `className` (ej. "h-20 w-20").
 */
export default function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  fit = "contain",
  className = "aspect-square w-full",
}: {
  src?: string;
  alt: string;
  /** Ayuda al navegador a elegir el tamaño de descarga (atributo sizes) */
  sizes: string;
  priority?: boolean;
  /** "contain": foto completa (recomendado). "cover": recorta para llenar (banners). */
  fit?: "contain" | "cover";
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-surface-2 ${className}`}
      >
        <Package className="text-slate-300" size={48} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      {fit === "contain" && (
        <Image
          src={src}
          alt=""
          aria-hidden
          fill
          sizes="48px"
          className="scale-125 object-cover opacity-70 blur-2xl"
        />
      )}

      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={fit === "cover" ? "object-cover" : "object-contain"}
      />
    </div>
  );
}
