"use client";

import { useSyncExternalStore } from "react";

/**
 * Tema de temporada que está aplicado ahora mismo en la página
 * ("navidad", "anio-nuevo" o "" si es el diseño normal).
 * Se actualiza solo si el tema cambia (por ejemplo al salir de la vista previa).
 */

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.getAttribute("data-theme") ?? "";
}

function getServerSnapshot() {
  return "";
}

export function useSeasonTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
