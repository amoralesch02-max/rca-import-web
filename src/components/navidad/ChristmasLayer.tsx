"use client";

import { useSeasonTheme } from "@/lib/use-season-theme";
import dynamic from "next/dynamic";

// La nieve solo se descarga cuando el tema Navidad está activo
const Snowfall = dynamic(() => import("@/components/navidad/Snowfall"), {
  ssr: false,
});

export default function ChristmasLayer() {
  const theme = useSeasonTheme();

  if (theme !== "navidad") {
    return null;
  }

  return <Snowfall />;
}
