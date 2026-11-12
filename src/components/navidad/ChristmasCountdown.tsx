"use client";

import {
  getChristmasShortText,
  getChristmasState,
  type ChristmasState,
} from "@/lib/christmas";
import { useSeasonTheme } from "@/lib/use-season-theme";
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

/** Texto de la barra superior: "🎄 Faltan 24 días para Navidad · Envíos a todo el Perú" */
export default function ChristmasCountdown() {
  const state = useChristmasState();

  if (!state) {
    return null;
  }

  const text = getChristmasShortText(state);

  if (state.phase === "before") {
    return <>🎄 {text} · Envíos a todo el Perú</>;
  }

  return <>🎄 {text} 🎅</>;
}
