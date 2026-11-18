"use client";

import { useSeasonTheme } from "@/lib/use-season-theme";
import dynamic from "next/dynamic";

// La decoración del encabezado solo se descarga cuando el tema Navidad está activo
const HeroDecor = dynamic(() => import("@/components/navidad/HeroDecor"), {
  ssr: false,
});

export default function HeroDecorLoader() {
  const theme = useSeasonTheme();

  if (theme !== "navidad") {
    return null;
  }

  return <HeroDecor />;
}
