import type { Metadata } from "next";
import type { ReactNode } from "react";

/** El panel admin no debe aparecer en Google ni mostrar vista previa. */
export const metadata: Metadata = {
  title: "Panel admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
