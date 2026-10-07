"use client";

import { useEffect } from "react";

/**
 * Hace que la página siempre abra desde arriba al recargar.
 *
 * Por qué hace falta: el navegador intenta volver a la posición anterior,
 * pero el inicio carga sus productos después de abrirse (la página aún es
 * corta) y el salto queda a medias. Aquí se desactiva esa restauración
 * solo mientras el inicio está abierto, y se devuelve a la normalidad al
 * salir, para que el botón "atrás" siga funcionando bien en las demás páginas.
 */
export default function ScrollToTop() {
  useEffect(() => {
    const previous = window.history.scrollRestoration;

    window.history.scrollRestoration = "manual";

    // "instant" evita la animación del scroll suave definido en globals.css
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  return null;
}
