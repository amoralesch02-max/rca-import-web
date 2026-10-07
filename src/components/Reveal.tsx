"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Hace que su contenido aparezca suavemente (subiendo un poco) cuando
 * entra en pantalla al hacer scroll. Solo ocurre una vez.
 *
 *   <Reveal>…</Reveal>
 *   <Reveal delay={0.1} y={16} scale={0.95} className="h-full">…</Reveal>
 */
export default function Reveal({
  children,
  delay = 0,
  y = 24,
  scale = 1,
  className,
}: {
  children: ReactNode;
  /** Segundos de espera antes de animar (útil para escalonar listas) */
  delay?: number;
  /** Cuántos píxeles sube al aparecer */
  y?: number;
  /** Escala inicial (ej. 0.95 para que "crezca" al aparecer) */
  scale?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -50px 0px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
