import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSupabaseCountryBySlug } from "@/lib/supabase-taxonomies";
import { buildMetadata } from "@/lib/site-metadata";

function prettifySlug(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Vista previa al compartir esta página (País). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getSupabaseCountryBySlug(slug);
  const name = item?.name ?? prettifySlug(slug);

  return buildMetadata({
    title: name,
    description: item?.description || `Productos importados desde ${name} en RCA IMPORT, con envíos a todo el Perú.`,
    path: `/pais/${slug}`,
  });
}

export default function CountryLayout({ children }: { children: ReactNode }) {
  return children;
}
