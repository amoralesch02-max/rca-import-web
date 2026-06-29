"use client";

import PublicProductCard from "@/components/PublicProductCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  getSupabaseProducts,
  type PublicProduct,
} from "@/lib/supabase-products";
import {
  getSupabaseCategories,
  type PublicCategory,
} from "@/lib/supabase-taxonomies";
import {
  BadgePercent,
  Boxes,
  CheckCircle2,
  Filter,
  Grid3X3,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const sortOptions = [
  "Orden recomendado",
  "Menor precio",
  "Mayor precio",
  "Nombre A-Z",
  "Nombre Z-A",
  "Mayor stock",
];

function getAvailableStock(product: PublicProduct) {
  return Math.max(product.stock - product.reservedStock, 0);
}

function getFinalPrice(product: PublicProduct) {
  return product.salePrice ?? product.price;
}

export default function CatalogPage() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Orden recomendado");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyDeals, setOnlyDeals] = useState(false);
  const [wholesaleOnly, setWholesaleOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatalogData();

    const searchParams = new URLSearchParams(window.location.search);
    const type = searchParams.get("tipo");

    if (type === "mayorista") {
      setWholesaleOnly(true);
    }
  }, []);

  async function loadCatalogData() {
    setLoading(true);

    const [supabaseProducts, supabaseCategories] = await Promise.all([
      getSupabaseProducts(),
      getSupabaseCategories(),
    ]);

    setProducts(supabaseProducts);
    setCategories(supabaseCategories);
    setLoading(false);
  }

  function resetFilters() {
    setSelectedCategory("Todos");
    setSearch("");
    setSort("Orden recomendado");
    setOnlyAvailable(false);
    setOnlyDeals(false);
    setWholesaleOnly(false);

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/catalogo");
    }
  }

  const categoryOptions = useMemo(() => {
    return ["Todos", ...categories.map((category) => category.name)];
  }, [categories]);

  const stats = useMemo(() => {
    const available = products.filter(
      (product) =>
        product.available !== false &&
        product.visible !== false &&
        getAvailableStock(product) > 0
    ).length;

    const deals = products.filter((product) => product.salePrice).length;
    const wholesale = products.filter((product) => product.wholesale).length;
    const featured = products.filter((product) => product.featured).length;

    return {
      total: products.length,
      available,
      deals,
      wholesale,
      featured,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "Todos") {
      result = result.filter(
        (product) =>
          product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.country.toLowerCase().includes(query) ||
          product.condition.toLowerCase().includes(query) ||
          product.tag.toLowerCase().includes(query)
      );
    }

    if (onlyAvailable) {
      result = result.filter(
        (product) =>
          product.available !== false &&
          product.visible !== false &&
          getAvailableStock(product) > 0
      );
    }

    if (onlyDeals) {
      result = result.filter((product) => Boolean(product.salePrice));
    }

    if (wholesaleOnly) {
      result = result.filter((product) => product.wholesale);
    }

    if (sort === "Menor precio") {
      result.sort((a, b) => getFinalPrice(a) - getFinalPrice(b));
    }

    if (sort === "Mayor precio") {
      result.sort((a, b) => getFinalPrice(b) - getFinalPrice(a));
    }

    if (sort === "Nombre A-Z") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sort === "Nombre Z-A") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    if (sort === "Mayor stock") {
      result.sort((a, b) => getAvailableStock(b) - getAvailableStock(a));
    }

    if (sort === "Orden recomendado") {
      result.sort((a, b) => {
        if (a.featured !== b.featured) {
          return Number(b.featured) - Number(a.featured);
        }

        if (a.salePrice && !b.salePrice) return -1;
        if (!a.salePrice && b.salePrice) return 1;

        return getAvailableStock(b) - getAvailableStock(a);
      });
    }

    return result;
  }, [
    products,
    selectedCategory,
    search,
    sort,
    onlyAvailable,
    onlyDeals,
    wholesaleOnly,
  ]);

  const activeFilterCount = [
    selectedCategory !== "Todos",
    Boolean(search.trim()),
    onlyAvailable,
    onlyDeals,
    wholesaleOnly,
    sort !== "Orden recomendado",
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-300 md:p-12">
          <div className="absolute right-[-140px] top-[-160px] h-96 w-96 rounded-full bg-[#0057A8]/30 blur-3xl" />
          <div className="absolute bottom-[-180px] left-[-120px] h-96 w-96 rounded-full bg-[#E31B23]/25 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.42fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                <PackageSearch size={16} />
                Catálogo RCA IMPORT
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                Explora productos importados con stock real.
              </h1>

              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-300 md:text-base">
                Filtra por categoría, disponibilidad, ofertas o productos al por
                mayor.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#catalogo-productos"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-700"
                >
                  Ver productos
                  <Grid3X3 size={18} />
                </a>

                <Link
                  href="/contacto"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  Consultar stock
                  <ShieldCheck size={18} />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Productos",
                  value: stats.total,
                  icon: Boxes,
                },
                {
                  label: "Disponibles",
                  value: stats.available,
                  icon: CheckCircle2,
                },
                {
                  label: "Ofertas",
                  value: stats.deals,
                  icon: Tag,
                },
                {
                  label: "Mayorista",
                  value: stats.wholesale,
                  icon: BadgePercent,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur"
                >
                  <item.icon className="text-blue-200" size={26} />

                  <p className="mt-4 text-3xl font-black">{item.value}</p>

                  <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-300">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px_160px]">
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
              <Search className="shrink-0 text-slate-400" size={20} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por producto, marca, categoría o país..."
                className="h-full w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 transition hover:text-[#E31B23]"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
              <SlidersHorizontal
                className="shrink-0 text-slate-400"
                size={20}
              />

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-full w-full bg-transparent text-sm font-black text-slate-700 outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <button
              onClick={loadCatalogData}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <RefreshCw size={17} />
              Recargar
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <FilterButton
              active={onlyAvailable}
              label="Solo disponibles"
              icon={CheckCircle2}
              onClick={() => setOnlyAvailable((value) => !value)}
            />

            <FilterButton
              active={onlyDeals}
              label="Solo ofertas"
              icon={Tag}
              onClick={() => setOnlyDeals((value) => !value)}
            />

            <FilterButton
              active={wholesaleOnly}
              label="Solo mayorista"
              icon={BadgePercent}
              onClick={() => setWholesaleOnly((value) => !value)}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {categoryOptions.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-5 py-3 text-sm font-black transition ${
                  selectedCategory === category
                    ? "bg-[#0057A8] text-white shadow-lg shadow-blue-100"
                    : "bg-[#f6f8fc] text-slate-700 hover:bg-slate-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl bg-blue-50 p-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <Filter className="text-[#0057A8]" size={20} />

                <p className="text-sm font-black text-[#0057A8]">
                  {activeFilterCount} filtro(s) aplicado(s)
                </p>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:text-[#E31B23]"
              >
                <X size={14} />
                Limpiar filtros
              </button>
            </div>
          )}
        </section>

        <section id="catalogo-productos" className="mt-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                Resultados
              </p>

              <h2 className="mt-3 text-4xl font-black">
                {filteredProducts.length} producto(s)
              </h2>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Categoría seleccionada: {selectedCategory}
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-600 shadow-sm">
              <Sparkles size={18} className="text-[#0057A8]" />
              {stats.featured} destacado(s)
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <RefreshCw
                className="mx-auto mb-4 animate-spin text-[#0057A8]"
                size={42}
              />

              <p className="font-black">Cargando catálogo desde Supabase...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <PublicProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Boxes className="mx-auto mb-4 text-slate-400" size={48} />

              <p className="text-2xl font-black">
                No hay productos encontrados.
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Prueba con otra búsqueda o limpia los filtros aplicados.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 inline-flex rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </section>
      </section>

      <SiteFooter />
    </main>
  );
}

function FilterButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-14 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black transition ${
        active
          ? "border-[#0057A8] bg-blue-50 text-[#0057A8]"
          : "border-slate-200 bg-[#f6f8fc] text-slate-600 hover:border-[#0057A8] hover:bg-white hover:text-[#0057A8]"
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}