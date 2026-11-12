/**
 * Cuenta regresiva a Navidad (para el tema navideño).
 * Usa el calendario del dispositivo del visitante: el 25 de diciembre,
 * sea la hora que sea, ya es Navidad.
 */

export type ChristmasPhase = "before" | "today" | "after";

export type ChristmasState = {
  phase: ChristmasPhase;
  /** Días que faltan (solo cuando phase = "before"; 1 = mañana es Navidad) */
  days: number;
};

export function getChristmasState(now: Date): ChristmasState {
  const month = now.getMonth(); // 11 = diciembre
  const day = now.getDate();

  if (month === 11 && day === 25) {
    return { phase: "today", days: 0 };
  }

  if (month === 11 && day > 25) {
    return { phase: "after", days: 0 };
  }

  const today = new Date(now.getFullYear(), month, day);
  const christmas = new Date(now.getFullYear(), 11, 25);
  const days = Math.round((christmas.getTime() - today.getTime()) / 86400000);

  return { phase: "before", days };
}

/** Texto corto, ej. "Faltan 14 días para Navidad" */
export function getChristmasShortText(state: ChristmasState) {
  if (state.phase === "today") {
    return "¡Feliz Navidad, Familia RCA IMPORT!";
  }

  if (state.phase === "after") {
    return "¡Felices fiestas, Familia RCA IMPORT!";
  }

  if (state.days === 1) {
    return "¡Mañana es Navidad!";
  }

  return `Faltan ${state.days} días para Navidad`;
}
