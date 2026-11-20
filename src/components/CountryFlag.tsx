"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Convierte una bandera en emoji (🇺🇸) a su código de país ("us").
 * Devuelve null si no es una bandera de país (🌎, texto, etc.).
 */
function flagToCode(flag: string) {
  const symbols = Array.from(flag);

  if (symbols.length !== 2) {
    return null;
  }

  const letters = symbols.map((symbol) => {
    const point = symbol.codePointAt(0) ?? 0;

    return point >= 0x1f1e6 && point <= 0x1f1ff
      ? String.fromCharCode(point - 0x1f1e6 + 97)
      : "";
  });

  return letters.every(Boolean) ? letters.join("") : null;
}

/**
 * Bandera del país de origen.
 * Windows no dibuja los emojis de bandera (muestra "US" en vez de 🇺🇸),
 * así que se muestra como imagen. Si no se puede cargar, vuelve al emoji.
 *
 * El aviso de error de la imagen se escucha desde un efecto (ya montado) y no
 * con onError: así no se actualiza el estado antes de que el componente esté
 * listo mientras la página termina de hidratarse.
 */
export default function CountryFlag({
  flag,
  name,
  className = "",
}: {
  flag?: string | null;
  name?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const text = (flag ?? "").trim();
  const code = flagToCode(text);

  useEffect(() => {
    const image = imageRef.current;

    if (!image) {
      return;
    }

    const handleError = () => setFailed(true);

    image.addEventListener("error", handleError);

    // Si la imagen ya falló antes de que este efecto corriera
    if (image.complete && image.naturalWidth === 0) {
      queueMicrotask(handleError);
    }

    return () => image.removeEventListener("error", handleError);
  }, [code]);

  if (!text) {
    return null;
  }

  if (!code || failed) {
    return <span className={className}>{text}</span>;
  }

  return (
    <img
      ref={imageRef}
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={name ? `Bandera de ${name}` : ""}
      width={20}
      height={15}
      loading="lazy"
      className={`inline-block h-[0.95em] w-auto rounded-[2px] align-[-0.12em] ring-1 ring-black/10 ${className}`}
    />
  );
}
