import type { Metadata } from "next";

/**
 * Vista previa al compartir enlaces (WhatsApp, Facebook, Instagram, etc.)
 * y título/descr. para Google. Solo se usa en el servidor.
 */

export const SITE_NAME = "RCA IMPORT";

export const SITE_DESCRIPTION =
  "iPhones, accesorios y tecnología importada. Envíos a todo el Perú y pedidos por WhatsApp.";

/**
 * Dirección pública de la web. En Vercel se detecta sola (tu dominio de
 * producción). Si quieres fijarla, crea la variable NEXT_PUBLIC_SITE_URL,
 * ej. https://rcaimport.pe
 */
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;

  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (vercel) {
    return `https://${vercel}`;
  }

  return "http://localhost:3000";
}

/** Imagen general (logo) para las páginas que no tienen foto propia. */
export const DEFAULT_SHARE_IMAGE = {
  url: "/og-rca.jpg",
  width: 1200,
  height: 630,
  alt: "RCA IMPORT · Tecnología importada en Perú",
};

/**
 * Foto para la vista previa al compartir. Se usa la original de Supabase
 * (la optimización de imágenes de Vercel está desactivada en next.config.ts).
 */
export function getShareImageUrl(src: string) {
  if (!src) {
    return "";
  }

  return src;
}

export function buildMetadata({
  title,
  shareTitle,
  description,
  path,
  image,
  canonical = true,
}: {
  /** Título de la pestaña (se le agrega " | RCA IMPORT") */
  title?: string;
  /** Título de la vista previa al compartir. Por defecto, el mismo título. */
  shareTitle?: string;
  description: string;
  path: string;
  image?: { url: string; width?: number; height?: number; alt?: string };
  /** false en el layout raíz, para que no lo hereden las demás páginas */
  canonical?: boolean;
}): Metadata {
  const images = [image?.url ? image : DEFAULT_SHARE_IMAGE];
  const ogTitle = shareTitle || (title ? `${title} | ${SITE_NAME}` : SITE_NAME);

  return {
    ...(title ? { title } : {}),
    description,
    ...(canonical ? { alternates: { canonical: path } } : {}),
    openGraph: {
      type: "website",
      locale: "es_PE",
      siteName: SITE_NAME,
      url: path,
      title: ogTitle,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: images.map((item) => item.url),
    },
  };
}
