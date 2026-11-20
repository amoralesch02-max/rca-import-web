import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getStartingPrice } from "@/lib/product-options";
import { getSupabaseProductBySlug } from "@/lib/supabase-products";
import { buildMetadata, getShareImageUrl } from "@/lib/site-metadata";

/** Vista previa del producto al compartir: foto, nombre y precio. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const path = `/producto/${slug}`;
  const product = await getSupabaseProductBySlug(slug);

  if (!product) {
    return buildMetadata({
      title: "Producto no disponible",
      description: "Mira el catálogo completo de RCA IMPORT.",
      path,
    });
  }

  const starting = getStartingPrice(product);
  const price =
    starting.final > 0
      ? `${starting.hasRange ? "Desde " : ""}S/ ${starting.final}`
      : "";

  const details = [
    product.condition,
    product.country ? `Importado de ${product.country}` : "",
    "Envíos a todo el Perú",
  ].filter(Boolean);

  const photo =
    product.imageUrl || product.colorOptions?.[0]?.images?.[0] || "";

  return buildMetadata({
    title: product.name,
    shareTitle: price ? `${product.name} · ${price}` : product.name,
    description: `${details.join(" · ")}. Pide por WhatsApp en RCA IMPORT.`,
    path,
    image: photo
      ? { url: getShareImageUrl(photo), alt: product.name }
      : undefined,
  });
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  return children;
}
