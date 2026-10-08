"use client";

import { Package } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

/**
 * Imagen de producto reutilizable (tarjetas, carrusel, carrito, galería).
 *
 * - Pensada para fotos CUADRADAS (ej. 1254 x 1254): llenan todo el marco.
 * - Si una foto NO es cuadrada, se muestra completa y centrada, y los lados
 *   se rellenan con una versión difuminada de la misma foto.
 *   Ese relleno solo se dibuja cuando hace falta: con fotos cuadradas no se
 *   usa ningún desenfoque, lo que mantiene la página fluida.
 * - Usa next/image: el navegador descarga una versión del tamaño justo.
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
  const [needsFill, setNeedsFill] = useState(false);

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
      {fit === "contain" && needsFill && (
        <Image
          src={src}
          alt=""
          aria-hidden
          fill
          sizes="48px"
          className="scale-125 object-cover opacity-70 blur-xl"
        />
      )}

      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={fit === "cover" ? "object-cover" : "object-contain"}
        onLoad={(event) => {
          const image = event.currentTarget;

          if (image.naturalWidth && image.naturalHeight) {
            const ratio = image.naturalWidth / image.naturalHeight;

            setNeedsFill(Math.abs(ratio - 1) > 0.04);
          }
        }}
      />
    </div>
  );
}
