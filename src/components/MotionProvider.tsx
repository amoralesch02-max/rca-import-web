"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Respeta la opción "reducir movimiento" del dispositivo del visitante:
 * si la tiene activada, las animaciones de motion se simplifican solas.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
