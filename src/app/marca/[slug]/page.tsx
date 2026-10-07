"use client";

import TaxonomyListing from "@/components/TaxonomyListing";
import {
  getSupabaseProducts,
  type PublicProduct,
} from "@/lib/supabase-products";
import {
  getSupabaseBrandBySlug,
  type PublicBrand,
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

export default function BrandPage() {
  const params = useParams();
  const slug = String(params.slug);

  const [brand, setBrand] = useState<PublicBrand | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const [brandData, productsData] = await Promise.all([
        getSupabaseBrandBySlug(slug),
        getSupabaseProducts(),
      ]);

      setBrand(brandData);
      setProducts(productsData);
      setLoading(false);
    }

    if (slug) {
      loadData();
    }
  }, [slug]);

  const brandName = brand?.name ?? prettifySlug(slug);

  const brandProducts = useMemo(() => {
    return products.filter((product) => generateSlug(product.brand) === slug);
  }, [products, slug]);

  return (
    <TaxonomyListing
      sectionLabel="Marca"
      title={brandName}
      description={
        brand?.description ||
        `Productos de ${brandName} disponibles en RCA IMPORT, con stock actualizado.`
      }
      products={brandProducts}
      loading={loading}
      searchPlaceholder={`Buscar dentro de ${brandName}...`}
      facets={["category", "country", "condition"]}
      emptyTitle="Aún no hay productos de esta marca."
      emptyText={`Pronto agregaremos productos de ${brandName}. Mientras tanto, explora el catálogo completo.`}
    />
  );
}
