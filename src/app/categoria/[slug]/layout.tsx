import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSupabaseCategoryBySlug } from "@/lib/supabase-taxonomies";
import { buildMetadata } from "@/lib/site-metadata";

function prettifySlug(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Vista previa al compartir esta página (Categoría). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getSupabaseCategoryBySlug(slug);
  const name = item?.name ?? prettifySlug(slug);

  return buildMetadata({
    title: name,
    description: item?.description || `Productos de ${name} en RCA IMPORT: originales, con stock actualizado y envíos a todo el Perú.`,
    path: `/categoria/${slug}`,
  });
}

export default function CategoryLayout({ children }: { children: ReactNode }) {
  return children;
}
