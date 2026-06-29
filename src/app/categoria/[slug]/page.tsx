"use client";

import PublicProductCard from "@/components/PublicProductCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  getSupabaseProducts,
  type PublicProduct,
} from "@/lib/supabase-products";
import {
  getSupabaseCategoryBySlug,
  type PublicCategory,
} from "@/lib/supabase-taxonomies";
import {
  BadgeCheck,
  Box,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Filter,
  Grid3X3,
  Home,
  PackageSearch,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const sortOptions = [
  "Orden recomendado",
  "Menor precio",
  "Mayor precio",
  "Nombre A-Z",
  "Nombre Z-A",
  "Mayor stock",
];

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

function getAvailableStock(product: PublicProduct) {
  return Math.max(product.stock - product.reservedStock, 0);
}

function getFinalPrice(product: PublicProduct) {
  return product.salePrice ?? product.price;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = String(params.slug);

  const [category, setCategory] = useState<PublicCategory | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Orden recomendado");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyDeals, setOnlyDeals] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const [categoryData, productsData] = await Promise.all([
        getSupabaseCategoryBySlug(slug),
        getSupabaseProducts(),
      ]);

      setCategory(categoryData);
      setProducts(productsData);
      setLoading(false);
    }

    if (slug) {
      loadData();
    }
  }, [slug]);

  async function reloadData() {
    setLoading(true);

    const [categoryData, productsData] = await Promise.all([
      getSupabaseCategoryBySlug(slug),
      getSupabaseProducts(),
    ]);

    setCategory(categoryData);
    setProducts(productsData);
    setLoading(false);
  }

  function resetFilters() {
    setSearch("");
    setSort("Orden recomendado");
    setOnlyAvailable(false);
    setOnlyDeals(false);
  }

  const categoryName = category?.name ?? prettifySlug(slug);

  const categoryProducts = useMemo(() => {
    return products.filter((product) => generateSlug(product.category) === slug);
  }, [products, slug]);

  const filteredProducts = useMemo(() => {
    let result = [...categoryProducts];

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
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
  }, [categoryProducts, search, sort, onlyAvailable, onlyDeals]);

  const stats = useMemo(() => {
    const available = categoryProducts.filter(
      (product) =>
        product.available !== false &&
        product.visible !== false &&
        getAvailableStock(product) > 0
    ).length;

    const deals = categoryProducts.filter((product) =>
      Boolean(product.salePrice)
    ).length;

    const featured = categoryProducts.filter(
      (product) => product.featured
    ).length;

    return {
      total: categoryProducts.length,
      available,
      deals,
      featured,
    };
  }, [categoryProducts]);

  const activeFilterCount = [
    Boolean(search.trim()),
    onlyAvailable,
    onlyDeals,
    sort !== "Orden recomendado",
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
          <Link
            href="/"
            className="inline-flex items-center gap-1 transition hover:text-[#0057A8]"
          >
            <Home size={15} />
            Inicio
          </Link>

          <ChevronRight size={15} className="text-slate-300" />

          <Link href="/catalogo" className="transition hover:text-[#0057A8]">
            Catálogo
          </Link>

          <ChevronRight size={15} className="text-slate-300" />

          <span className="text-slate-950">{categoryName}</span>
        </div>

        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-300 md:p-12">
          <div className="absolute right-[-150px] top-[-170px] h-96 w-96 rounded-full bg-[#0057A8]/30 blur-3xl" />
          <div className="absolute bottom-[-200px] left-[-130px] h-96 w-96 rounded-full bg-[#E31B23]/25 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.42fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                <Box size={16} />
                Categoría RCA IMPORT
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                {categoryName}
              </h1>

              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-300 md:text-base">
                {category?.description ??
                  "Productos disponibles dentro de esta categoría en RCA IMPORT. Explora opciones, compara precios y consulta disponibilidad por WhatsApp."}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#productos-categoria"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-700"
                >
                  Ver productos
                  <Grid3X3 size={18} />
                </a>

                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  <ChevronLeft size={18} />
                  Catálogo completo
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroStat title="Productos" value={stats.total} />
              <HeroStat title="Disponibles" value={stats.available} />
              <HeroStat title="Ofertas" value={stats.deals} />
              <HeroStat title="Destacados" value={stats.featured} />
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
                placeholder={`Buscar dentro de ${categoryName}...`}
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
              type="button"
              onClick={reloadData}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <RefreshCw size={17} />
              Recargar
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
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

        <section id="productos-categoria" className="mt-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                Productos encontrados
              </p>

              <h2 className="mt-3 text-4xl font-black">
                {filteredProducts.length} producto(s)
              </h2>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Categoría: {categoryName}
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

              <p className="font-black">Cargando productos desde Supabase...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <PublicProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
              <div className="bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),radial-gradient(circle_at_bottom_right,#fee2e2,transparent_35%)] p-10 text-center">
                <ShoppingBag className="mx-auto mb-4 text-slate-400" size={54} />

                <p className="text-2xl font-black">
                  Aún no hay productos en esta categoría.
                </p>

                <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-7 text-slate-500">
                  Puedes revisar el catálogo completo o consultar por WhatsApp si
                  estás buscando un producto específico.
                </p>

                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/catalogo"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white transition hover:bg-blue-700"
                  >
                    Ver catálogo
                    <ChevronRight size={18} />
                  </Link>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    Limpiar filtros
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: BadgeCheck,
              title: "Stock actualizado",
              text: "Los productos de esta categoría se administran desde Supabase.",
            },
            {
              icon: PackageSearch,
              title: "Consulta directa",
              text: "Puedes consultar disponibilidad y detalles por WhatsApp.",
            },
            {
              icon: ShoppingBag,
              title: "Separación rápida",
              text: "Agrega productos al carrito y registra tu reserva con comprobante.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0057A8]">
                  <Icon size={25} />
                </div>

                <h3 className="mt-4 text-xl font-black">{item.title}</h3>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  {item.text}
                </p>
              </div>
            );
          })}
        </section>
      </section>

      <SiteFooter />
    </main>
  );
}

function HeroStat({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
      <Sparkles className="text-blue-200" size={24} />

      <p className="mt-4 truncate text-3xl font-black">{value}</p>

      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-300">
        {title}
      </p>
    </div>
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