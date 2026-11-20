import { redirect } from "next/navigation";

/**
 * Las entregas ahora se muestran en "Nosotros" (sección de reseñas).
 * Esta ruta se conserva solo para no romper enlaces antiguos.
 */
export default function EntregasPage() {
  redirect("/nosotros#resenas");
}
