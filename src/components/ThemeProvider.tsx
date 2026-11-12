"use client";

import {
  SEASON_THEME_LABELS,
  parseSeasonTheme,
} from "@/lib/store-settings";
import { loadSharedStoreSettings } from "@/lib/use-store-settings";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Aplica el tema de temporada de la tienda (Normal / Navidad / Año Nuevo).
 *
 * - El tema público sale de Configuración en el panel admin.
 * - "Vista previa": al abrir la tienda con ?tema=navidad, ese navegador ve el
 *   tema aunque no esté activo para el público. Dura mientras la pestaña esté
 *   abierta y muestra un aviso para poder salir.
 * - El panel admin nunca usa el tema.
 *
 * El script de layout.tsx aplica el tema recordado antes de que se dibuje la
 * página (para evitar el parpadeo); este componente lo confirma y corrige.
 */

const PREVIEW_KEY = "rca_theme_preview";
const THEME_KEY = "rca_theme";

function applyTheme(theme: string | null) {
  const root = document.documentElement;

  if (theme === "navidad" || theme === "anio-nuevo") {
    root.setAttribute("data-theme", theme);
  } else {
    root.removeAttribute("data-theme");
  }
}

function readStorage(storage: "session" | "local", key: string) {
  try {
    return (storage === "session" ? sessionStorage : localStorage).getItem(key);
  } catch {
    return null;
  }
}

export default function ThemeProvider() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  const [publicTheme, setPublicTheme] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const previewValue = readStorage("session", PREVIEW_KEY);
    setPreview(previewValue ? parseSeasonTheme(previewValue) : null);

    loadSharedStoreSettings()
      .then((settings) => {
        if (!active) return;

        const theme = parseSeasonTheme(settings.seasonTheme);
        setPublicTheme(theme);

        try {
          localStorage.setItem(THEME_KEY, theme);
        } catch {
          // sin almacenamiento disponible: no pasa nada
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      applyTheme(null);
      return;
    }

    const remembered = readStorage("local", THEME_KEY);

    applyTheme(preview ?? publicTheme ?? remembered);
  }, [isAdmin, preview, publicTheme]);

  function exitPreview() {
    try {
      sessionStorage.removeItem(PREVIEW_KEY);
    } catch {
      // nada
    }

    setPreview(null);
  }

  if (!preview || preview === "normal" || isAdmin) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-5 z-[60] flex items-center gap-3 rounded-full bg-slate-950 py-2 pl-4 pr-2 text-xs font-semibold text-white shadow-xl">
      <span className="h-2 w-2 rounded-full bg-amber-300" />
      Vista previa privada: {SEASON_THEME_LABELS[parseSeasonTheme(preview)]}
      <button
        type="button"
        onClick={exitPreview}
        className="rounded-full bg-white/15 px-3 py-1.5 transition hover:bg-white/25"
      >
        Salir
      </button>
    </div>
  );
}
