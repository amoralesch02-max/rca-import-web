/**
 * Animación "la foto vuela al carrito".
 *
 * Crea una miniatura del producto encima del botón que se tocó y la lleva,
 * haciendo un arco, hasta el ícono del carrito del header
 * (el elemento con data-cart-target que esté visible).
 *
 * Termina (la promesa se resuelve) cuando la miniatura llega, o al instante
 * si no hay a dónde volar o el usuario pidió "reducir movimiento".
 */

const THUMB_SIZE = 72;
const DURATION = 700;

/** Versión pequeña de la foto, para que cargue al instante. */
export function getCartThumb(src?: string) {
  if (!src) {
    return "";
  }

  if (/^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\//.test(src)) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=128&q=75`;
  }

  return src;
}

/** Descarga la miniatura por adelantado (así ya está lista al tocar el botón). */
export function preloadCartThumb(src?: string) {
  const thumb = getCartThumb(src);

  if (thumb && typeof window !== "undefined") {
    const image = new Image();
    image.src = thumb;
  }
}

function findCartTarget() {
  const targets = document.querySelectorAll<HTMLElement>("[data-cart-target]");

  for (const target of targets) {
    const rect = target.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      return target;
    }
  }

  return null;
}

export function flyToCart(from: HTMLElement | null, src?: string) {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !from) {
      resolve();
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const target = findCartTarget();
    const thumb = getCartThumb(src);

    if (reduceMotion || !target || !thumb || !("animate" in Element.prototype)) {
      resolve();
      return;
    }

    const start = from.getBoundingClientRect();
    const end = target.getBoundingClientRect();

    const startX = start.left + start.width / 2 - THUMB_SIZE / 2;
    const startY = start.top + start.height / 2 - THUMB_SIZE / 2;
    const dx = end.left + end.width / 2 - THUMB_SIZE / 2 - startX;
    const dy = end.top + end.height / 2 - THUMB_SIZE / 2 - startY;

    const image = document.createElement("img");
    image.src = thumb;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");

    Object.assign(image.style, {
      position: "fixed",
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${THUMB_SIZE}px`,
      height: `${THUMB_SIZE}px`,
      objectFit: "contain",
      background: "#ffffff",
      borderRadius: "18px",
      boxShadow: "0 12px 28px rgba(15, 23, 42, 0.28)",
      zIndex: "100",
      pointerEvents: "none",
      willChange: "transform, opacity",
    });

    document.body.appendChild(image);

    const animation = image.animate(
      [
        { transform: "translate(0, 0) scale(0.6)", opacity: 0 },
        { transform: "translate(0, -12px) scale(1)", opacity: 1, offset: 0.15 },
        {
          // Punto alto del arco
          transform: `translate(${dx * 0.55}px, ${Math.min(dy * 0.55, 0) - 70}px) scale(0.8)`,
          opacity: 1,
          offset: 0.55,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(0.25)`, opacity: 0.7 },
      ],
      { duration: DURATION, easing: "cubic-bezier(0.45, 0, 0.55, 1)" }
    );

    const finish = () => {
      image.remove();
      resolve();
    };

    animation.onfinish = finish;
    animation.oncancel = finish;
  });
}
