"use client";

import TaxonomyListing from "@/components/TaxonomyListing";
import {
  getSupabaseProducts,
  type PublicProduct,
} from "@/lib/supabase-products";
import {
  getSupabaseCategories,
  getSupabaseCategoryBySlug,
  type PublicCategory,
} from "@/lib/supabase-taxonomies";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function prettifySlug(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function CategoryPage() {
  const params = useParams();
  const slug = String(params.slug);

  const [category, setCategory] = useState<PublicCategory | null>(null);
  const [allCategories, setAllCategories] = useState<PublicCategory[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const [categoryData, categoriesData, productsData] = await Promise.all([
        getSupabaseCategoryBySlug(slug),
        getSupabaseCategories(),
        getSupabaseProducts(),
      ]);

      setCategory(categoryData);
      setAllCategories(categoriesData);
      setProducts(productsData);
      setLoading(false);
    }

    if (slug) {
      loadData();
    }
  }, [slug]);

  const categoryName = category?.name ?? prettifySlug(slug);

  const categoryProducts = useMemo(() => {
    return products.filter((product) => generateSlug(product.category) === slug);
  }, [products, slug]);

  return (
    <TaxonomyListing
      title={categoryName}
      description={
        category?.description ||
        `Productos disponibles en la categoría ${categoryName}.`
      }
      products={categoryProducts}
      loading={loading}
      searchPlaceholder={`Buscar dentro de ${categoryName}...`}
      facets={["brand", "country", "condition"]}
      sidebarLinks={{
        title: "Categorías",
        items: allCategories.map((item) => ({
          label: item.name,
          href: `/categoria/${item.slug}`,
          active: item.slug === slug,
        })),
      }}
      emptyTitle="Aún no hay productos en esta categoría."
      emptyText="Revisa otras categorías o explora todo el catálogo."
    />
  );
}
