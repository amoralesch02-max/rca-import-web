"use client";

import {
  getChristmasShortText,
  getChristmasState,
  type ChristmasState,
} from "@/lib/christmas";
import { useSeasonTheme } from "@/lib/use-season-theme";
import { ShieldCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";

/** Estado de la cuenta regresiva. Solo trabaja mientras el tema Navidad está activo. */
export function useChristmasState() {
  const theme = useSeasonTheme();
  const [state, setState] = useState<ChristmasState | null>(null);

  useEffect(() => {
    if (theme !== "navidad") {
      return;
    }

    const update = () => setState(getChristmasState(new Date()));

    update();

    // Se revisa cada minuto para que cambie solo al pasar la medianoche
    const timer = window.setInterval(update, 60000);

    return () => window.clearInterval(timer);
  }, [theme]);

  return state;
}

/**
 * Barra superior en Navidad:
 * [camión] Faltan 24 días para Navidad | Envíos a todo el Perú | [escudo] Compras seguras
 * En celular solo se muestra la cuenta regresiva.
 */
export default function ChristmasCountdown() {
  const state = useChristmasState();

  if (!state) {
    return null;
  }

  const text = getChristmasShortText(state);

  if (state.phase !== "before") {
    return <>🎄 {text} 🎅</>;
  }

  return (
    <span className="inline-flex items-center justify-center gap-x-3">
      <span className="inline-flex items-center gap-1.5">
        <Truck size={14} className="text-emerald-400" />
        {text}
      </span>

      <span className="hidden h-3 w-px bg-white/25 sm:block" />
      <span className="hidden sm:inline">Envíos a todo el Perú</span>

      <span className="hidden h-3 w-px bg-white/25 md:block" />
      <span className="hidden items-center gap-1.5 md:inline-flex">
        <ShieldCheck size={14} className="text-sky-400" />
        Compras seguras
      </span>
    </span>
  );
}
