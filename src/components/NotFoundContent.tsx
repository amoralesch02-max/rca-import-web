"use client";

import PublicProductCard from "@/components/PublicProductCard";
import ShoppingBagArt from "@/components/ShoppingBagArt";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import GiftElf from "@/components/navidad/GiftElf";
import { sortRecommended } from "@/lib/product-order";
import { getSupabaseProducts, type PublicProduct } from "@/lib/supabase-products";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Página 404. En Navidad aparece el duende ("se perdió en el Polo Norte");
 * el resto del año, la bolsa de RCA con un signo de pregunta.
 */
export default function NotFoundContent() {
  const [products, setProducts] = useState<PublicProduct[]>([]);

  useEffect(() => {
    getSupabaseProducts()
      .then((items) => {
        const featured = items.filter((item) => item.featured);
        const list = sortRecommended(featured.length > 0 ? featured : items);

        setProducts(list.slice(0, 4));
      })
      .catch(() => undefined);
  }, []);

  return (
    <main className="min-h-screen bg-bg text-slate-950">
      <SiteHeader />

      <section className="mx-auto max-w-3xl px-5 py-14 text-center md:py-20">
        <GiftElf className="mx-auto w-32 md:w-36" />
        <ShoppingBagArt question className="nv-off mx-auto h-36 w-36 md:h-40 md:w-40" />

        <p className="mt-5 text-xs font-bold uppercase tracking-widest text-alert">
          Error 404
        </p>

        <h1 className="nv-off mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Ups, no encontramos esta página
        </h1>
        <h1 className="nv-only mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Ups, esta página se perdió en el Polo Norte
        </h1>

        <p className="nv-off mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Puede que el enlace esté mal escrito o que el producto ya no esté
          disponible. Busca lo que necesitas o vuelve al inicio.
        </p>
        <p className="nv-only mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Nuestro duende la buscó por todo el taller y no la encontró. Prueba
          buscando lo que necesitas o vuelve al inicio.
        </p>

        {/* Buscador: lleva al catálogo con la búsqueda hecha */}
        <form
          action="/catalogo"
          method="get"
          className="mx-auto mt-7 flex max-w-md items-center gap-2 rounded-full border border-line bg-white p-1.5 pl-5 shadow-sm focus-within:border-brand"
        >
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            name="q"
            type="search"
            placeholder="Buscar iPhone, cargador, case..."
            aria-label="Buscar productos"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="h-10 shrink-0 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Buscar
          </button>
        </form>

        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>
      </section>

      {products.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-14 md:px-6">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">
            Quizá te interese
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {products.map((product, index) => (
              <PublicProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
