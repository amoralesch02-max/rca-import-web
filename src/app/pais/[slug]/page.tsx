"use client";

import TaxonomyListing from "@/components/TaxonomyListing";
import {
  getSupabaseProducts,
  type PublicProduct,
} from "@/lib/supabase-products";
import {
  getSupabaseCountryBySlug,
  type PublicCountry,
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

export default function CountryPage() {
  const params = useParams();
  const slug = String(params.slug);

  const [country, setCountry] = useState<PublicCountry | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const [countryData, productsData] = await Promise.all([
        getSupabaseCountryBySlug(slug),
        getSupabaseProducts(),
      ]);

      setCountry(countryData);
      setProducts(productsData);
      setLoading(false);
    }

    if (slug) {
      loadData();
    }
  }, [slug]);

  const countryName = country?.name ?? prettifySlug(slug);
  const countryFlag = country?.flag ?? "🌎";

  const countryProducts = useMemo(() => {
    return products.filter((product) => generateSlug(product.country) === slug);
  }, [products, slug]);

  return (
    <TaxonomyListing
      sectionLabel="País de importación"
      title={countryName}
      titlePrefix={countryFlag}
      description={
        country?.description ||
        `Productos importados desde ${countryName} disponibles en RCA IMPORT, con stock actualizado.`
      }
      products={countryProducts}
      loading={loading}
      searchPlaceholder={`Buscar productos de ${countryName}...`}
      facets={["category", "brand", "condition"]}
      emptyTitle="Aún no hay productos de este país."
      emptyText={`Pronto agregaremos productos importados de ${countryName}. Mientras tanto, explora el catálogo completo.`}
    />
  );
}
