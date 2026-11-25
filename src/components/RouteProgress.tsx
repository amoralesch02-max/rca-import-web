"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/**
 * Barra de carga fina arriba de la pantalla al cambiar de página
 * (como en YouTube). Empieza al tocar un enlace interno o al ir
 * atrás/adelante, y termina cuando la nueva página ya está puesta.
 */

const START_DELAY = 120; // ms: si la página cambia antes, no se muestra (evita parpadeos)
const SAFETY_TIMEOUT = 8000; // ms: por si algo falla, nunca se queda pegada

function isInternalNavigation(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }

  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return false;

  let url: URL;

  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }

  if (url.origin !== window.location.origin) return false;

  // Mismo lugar (o solo cambia el #ancla): no hay página nueva
  return (
    url.pathname !== window.location.pathname ||
    url.search !== window.location.search
  );
}

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const route = `${pathname}?${searchParams.toString()}`;

  const [progress, setProgress] = useState(0); // 0 = oculta
  const [visible, setVisible] = useState(false);

  const timers = useRef<number[]>([]);
  const active = useRef(false);
  const firstRoute = useRef(route);

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function finish() {
    if (!active.current) return;

    active.current = false;
    clearTimers();
    setProgress(1);
    later(() => setVisible(false), 220);
    later(() => setProgress(0), 520);
  }

  function start() {
    if (active.current) return;

    active.current = true;
    clearTimers();

    later(() => {
      setVisible(true);
      setProgress(0.15);

      // Avanza cada vez más lento, sin llegar nunca al final
      const trickle = () => {
        setProgress((current) => Math.min(current + (0.9 - current) * 0.18, 0.9));
        later(trickle, 300);
      };

      later(trickle, 300);
    }, START_DELAY);

    later(finish, SAFETY_TIMEOUT);
  }

  // Escucha clics en enlaces y el botón atrás/adelante
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const anchor = (event.target as Element | null)?.closest?.("a");

      if (anchor && isInternalNavigation(anchor as HTMLAnchorElement, event)) {
        start();
      }
    }

    function handlePopState() {
      start();
    }

    // En fase de captura: los enlaces de Next cancelan el clic (preventDefault)
    // para navegar por su cuenta, así que hay que verlo antes que ellos.
    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
    // start/finish solo usan refs y setState
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La página nueva ya está: termina la barra
  useEffect(() => {
    if (route === firstRoute.current) return;

    firstRoute.current = route;
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px] transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="h-full origin-left bg-brand shadow-[0_0_8px_rgba(0,87,168,0.6)] transition-transform duration-300 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

export default function RouteProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
