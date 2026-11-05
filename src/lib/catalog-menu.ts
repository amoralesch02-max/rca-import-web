import { getStartingPrice } from "@/lib/product-options";
import { getGeneration, isIphone } from "@/lib/product-order";
import type { PublicProduct } from "@/lib/supabase-products";
import type { PublicCategory } from "@/lib/supabase-taxonomies";

/**
 * Datos del menú desplegable de "Catálogo".
 * Se calculan con los productos reales de la tienda, así que el menú
 * siempre muestra los modelos y las cantidades que realmente existen.
 */

export type CatalogMenuData = {
  /** Nombre de la categoría de iPhone (para los enlaces) */
  iphoneCategory: string;
  newCount: number;
  usedCount: number;
  /** Modelos de iPhone disponibles, del más nuevo al más antiguo */
  models: { label: string; query: string }[];
  /** Otras categorías con productos (accesorios, etc.) */
  otherCategories: { name: string; slug: string }[];
  lowestPrice: number | null;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function buildCatalogMenu(
  products: PublicProduct[],
  categories: PublicCategory[]
): CatalogMenuData {
  const phones = products.filter(isIphone);
  const iphoneCategory = phones[0]?.category ?? "iPhones";

  // "Nuevo" y "Nuevo sellado" cuentan como nuevos; "Seminuevo" aparte
  const newCount = phones.filter((product) =>
    normalize(product.condition).startsWith("nuevo")
  ).length;

  const usedCount = phones.filter((product) =>
    normalize(product.condition).includes("seminuevo")
  ).length;

  // Modelos: iPhone 11 en adelante, sin repetir, del más nuevo al más antiguo
  const generations = Array.from(
    new Set(
      phones
        .map((product) => getGeneration(product.name))
        .filter((generation) => generation >= 11)
    )
  )
    .sort((a, b) => b - a)
    .slice(0, 6);

  const models = generations.map((generation) => ({
    label: `iPhone ${generation}`,
    query: `iPhone ${generation}`,
  }));

  // Otras categorías que tengan productos (sin la de iPhone)
  const otherCategories = categories
    .filter(
      (category) =>
        normalize(category.name) !== normalize(iphoneCategory) &&
        products.some(
          (product) => normalize(product.category) === normalize(category.name)
        )
    )
    .slice(0, 4)
    .map((category) => ({ name: category.name, slug: category.slug }));

  const prices = products
    .map((product) => getStartingPrice(product).final)
    .filter((price) => price > 0);

  return {
    iphoneCategory,
    newCount,
    usedCount,
    models,
    otherCategories,
    lowestPrice: prices.length > 0 ? Math.min(...prices) : null,
  };
}
