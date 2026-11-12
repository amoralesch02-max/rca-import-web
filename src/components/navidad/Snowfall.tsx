"use client";

import { Snowflake } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/**
 * Nieve cayendo (solo tema Navidad).
 *
 * Es liviana a propósito: pocos copos (menos en celular), que solo usan
 * transformaciones CSS, sin librerías. Se puede apagar con el botón ❄ y el
 * navegador recuerda la elección. Si el dispositivo pide "reducir movimiento",
 * no se muestra.
 */

const STORAGE_KEY = "rca_snow";

// Números "al azar" fijos: así los copos no cambian entre cargas
function pseudo(index: number, salt: number) {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function Snowfall() {
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      return;
    }

    let saved: string | null = null;

    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }

    setAvailable(true);
    setEnabled(saved !== "off");
    setCount(window.innerWidth < 640 ? 14 : 28);
  }, []);

  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: pseudo(i, 1) * 100,
        size: 3 + pseudo(i, 2) * 5,
        duration: 11 + pseudo(i, 3) * 11,
        delay: -pseudo(i, 4) * 22,
        sway: (pseudo(i, 5) - 0.5) * 90,
        opacity: 0.6 + pseudo(i, 6) * 0.4,
      })),
    [count]
  );

  function toggle() {
    const next = !enabled;

    setEnabled(next);

    try {
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      // sin almacenamiento disponible: no pasa nada
    }
  }

  if (!available) {
    return null;
  }

  return (
    <>
      {enabled && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[45] overflow-hidden"
        >
          {flakes.map((flake, index) => (
            <span
              key={index}
              className="nv-flake"
              style={
                {
                  left: `${flake.left}%`,
                  width: flake.size,
                  height: flake.size,
                  opacity: flake.opacity,
                  animationDuration: `${flake.duration}s`,
                  animationDelay: `${flake.delay}s`,
                  "--nv-sway": `${flake.sway}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={enabled ? "Apagar la nieve" : "Encender la nieve"}
        title={enabled ? "Apagar la nieve" : "Encender la nieve"}
        className={`fixed bottom-5 left-5 z-[55] flex h-11 w-11 items-center justify-center rounded-full shadow-lg ring-1 ring-white/20 transition hover:scale-105 ${
          enabled ? "bg-slate-950 text-sky-200" : "bg-white text-slate-400"
        }`}
      >
        <Snowflake size={20} />
      </button>
    </>
  );
}
