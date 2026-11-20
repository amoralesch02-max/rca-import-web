import type { ReactNode } from "react";
import { buildMetadata } from "@/lib/site-metadata";

export const metadata = buildMetadata({
  title: "Libro de Reclamaciones",
  description: "Libro de Reclamaciones virtual de RCA IMPORT.",
  path: "/libro-reclamaciones",
});

export default function ComplaintsBookLayout({ children }: { children: ReactNode }) {
  return children;
}
