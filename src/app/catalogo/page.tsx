"use client";

import ProductCardSkeleton from "@/components/ProductCardSkeleton";
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
  Boxes,
  ChevronDown,
  Search,
  SlidersHorizontal,
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

const priceRanges = [
  { label: "Menos de S/ 100", min: "", max: "100" },
  { label: "S/ 100 – 300", min: "100", max: "300" },
  { label: "S/ 300 – 1,000", min: "300", max: "1000" },
  { label: "Más de S/ 1,000", min: "1000", max: "" },
];

function getAvailableStock(product: PublicProduct) {
  return Math.max(product.stock - product.reservedStock, 0);
}

function getFinalPrice(product: PublicProduct) {
  return product.salePrice ?? product.price;
}

function isInStock(product: PublicProduct) {
  return (
    product.available !== false &&
    product.visible !== false &&
    getAvailableStock(product) > 0
  );
}

function toggleInList(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export default function CatalogPage() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Orden recomendado");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyDeals, setOnlyDeals] = useState(false);
  const [wholesaleOnly, setWholesaleOnly] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);

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
    setSearch("");
    setSort("Orden recomendado");
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedConditions([]);
    setMinPrice("");
    setMaxPrice("");
    setOnlyAvailable(false);
    setOnlyDeals(false);
    setWholesaleOnly(false);

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/catalogo");
    }
  }

  // Opciones de filtro con su cantidad de productos
  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      label: category.name,
      count: products.filter(
        (product) =>
          product.category.toLowerCase() === category.name.toLowerCase()
      ).length,
    }));
  }, [categories, products]);

  const brandOptions = useMemo(() => {
    const names = Array.from(
      new Set(products.map((product) => product.brand).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return names.map((name) => ({
      label: name,
      count: products.filter((product) => product.brand === name).length,
    }));
  }, [products]);

  const conditionOptions = useMemo(() => {
    const names = Array.from(
      new Set(products.map((product) => product.condition).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return names.map((name) => ({
      label: name,
      count: products.filter((product) => product.condition === name).length,
    }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategories.length > 0) {
      const wanted = selectedCategories.map((item) => item.toLowerCase());
      result = result.filter((product) =>
        wanted.includes(product.category.toLowerCase())
      );
    }

    if (selectedBrands.length > 0) {
      result = result.filter((product) =>
        selectedBrands.includes(product.brand)
      );
    }

    if (selectedConditions.length > 0) {
      result = result.filter((product) =>
        selectedConditions.includes(product.condition)
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

    if (minPrice !== "" && !Number.isNaN(Number(minPrice))) {
      result = result.filter(
        (product) => getFinalPrice(product) >= Number(minPrice)
      );
    }

    if (maxPrice !== "" && !Number.isNaN(Number(maxPrice))) {
      result = result.filter(
        (product) => getFinalPrice(product) <= Number(maxPrice)
      );
    }

    if (onlyAvailable) {
      result = result.filter(isInStock);
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
    selectedCategories,
    selectedBrands,
    selectedConditions,
    search,
    sort,
    minPrice,
    maxPrice,
    onlyAvailable,
    onlyDeals,
    wholesaleOnly,
  ]);

  const hasPriceFilter = minPrice !== "" || maxPrice !== "";

  const activeFilterCount =
    selectedCategories.length +
    selectedBrands.length +
    selectedConditions.length +
    [hasPriceFilter, onlyAvailable, onlyDeals, wholesaleOnly].filter(Boolean)
      .length;

  // Chips de filtros activos (se muestran sobre la cuadrícula)
  const activeChips: { label: string; onRemove: () => void }[] = [
    ...selectedCategories.map((name) => ({
      label: name,
      onRemove: () =>
        setSelectedCategories((list) => list.filter((item) => item !== name)),
    })),
    ...selectedBrands.map((name) => ({
      label: name,
      onRemove: () =>
        setSelectedBrands((list) => list.filter((item) => item !== name)),
    })),
    ...selectedConditions.map((name) => ({
      label: name,
      onRemove: () =>
        setSelectedConditions((list) => list.filter((item) => item !== name)),
    })),
    ...(hasPriceFilter
      ? [
          {
            label: `S/ ${minPrice || "0"} – ${maxPrice ? `S/ ${maxPrice}` : "más"}`,
            onRemove: () => {
              setMinPrice("");
              setMaxPrice("");
            },
          },
        ]
      : []),
    ...(onlyAvailable
      ? [{ label: "Disponibles", onRemove: () => setOnlyAvailable(false) }]
      : []),
    ...(onlyDeals
      ? [{ label: "Ofertas", onRemove: () => setOnlyDeals(false) }]
      : []),
    ...(wholesaleOnly
      ? [{ label: "Mayorista", onRemove: () => setWholesaleOnly(false) }]
      : []),
  ];

  const filtersPanel = (
    <div className="grid gap-6">
      <FilterGroup title="Categoría">
        <CheckList
          options={categoryOptions}
          selected={selectedCategories}
          onToggle={(value) =>
            setSelectedCategories((list) => toggleInList(list, value))
          }
        />
      </FilterGroup>

      {brandOptions.length > 0 && (
        <FilterGroup title="Marca">
          <CheckList
            options={brandOptions}
            selected={selectedBrands}
            onToggle={(value) =>
              setSelectedBrands((list) => toggleInList(list, value))
            }
          />
        </FilterGroup>
      )}

      {conditionOptions.length > 0 && (
        <FilterGroup title="Condición">
          <CheckList
            options={conditionOptions}
            selected={selectedConditions}
            onToggle={(value) =>
              setSelectedConditions((list) => toggleInList(list, value))
            }
          />
        </FilterGroup>
      )}

      <FilterGroup title="Precio">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="Mín"
            className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm outline-none transition focus:border-brand focus:bg-white"
          />
          <span className="text-slate-400">—</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Máx"
            className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm outline-none transition focus:border-brand focus:bg-white"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {priceRanges.map((range) => {
            const active = minPrice === range.min && maxPrice === range.max;

            return (
              <button
                key={range.label}
                type="button"
                onClick={() => {
                  setMinPrice(active ? "" : range.min);
                  setMaxPrice(active ? "" : range.max);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-brand bg-blue-50 text-brand"
                    : "border-line bg-white text-slate-600 hover:border-brand hover:text-brand"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Más filtros">
        <div className="grid gap-2.5">
          <ToggleRow
            label="Solo disponibles"
            checked={onlyAvailable}
            onChange={() => setOnlyAvailable((value) => !value)}
          />
          <ToggleRow
            label="Solo ofertas"
            checked={onlyDeals}
            onChange={() => setOnlyDeals((value) => !value)}
          />
          <ToggleRow
            label="Solo mayorista"
            checked={wholesaleOnly}
            onChange={() => setWholesaleOnly((value) => !value)}
          />
        </div>
      </FilterGroup>

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line text-sm font-semibold text-slate-600 transition hover:border-alert hover:text-alert"
        >
          <X size={15} />
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-bg text-slate-950">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        {/* Migas de pan */}
        <p className="text-xs text-slate-500">
          <Link href="/" className="transition hover:text-brand">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Catálogo</span>
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* ============ Panel lateral (escritorio) ============ */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-line bg-white p-5">
              {filtersPanel}
            </div>
          </aside>

          {/* ============ Contenido ============ */}
          <div id="catalogo-productos" className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {wholesaleOnly ? "Catálogo mayorista" : "Todos los productos"}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Cargando..."
                : `${filteredProducts.length} ${
                    filteredProducts.length === 1 ? "producto" : "productos"
                  }`}
            </p>

            {/* Buscador + orden */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-line bg-white px-4 transition focus-within:border-brand">
                <Search className="shrink-0 text-slate-400" size={18} />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por producto, marca, categoría o país..."
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Borrar búsqueda"
                    className="shrink-0 text-slate-400 transition hover:text-alert"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold transition hover:border-brand lg:hidden"
                >
                  <SlidersHorizontal size={17} />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div className="relative flex-1 sm:w-52 sm:flex-none">
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    aria-label="Ordenar productos"
                    className="h-12 w-full appearance-none rounded-xl border border-line bg-white pl-4 pr-10 text-sm font-medium outline-none transition focus:border-brand"
                  >
                    {sortOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Chips de filtros activos */}
            {activeChips.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={chip.onRemove}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-blue-100"
                  >
                    {chip.label}
                    <X size={13} />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-2 text-xs font-semibold text-slate-500 transition hover:text-alert"
                >
                  Limpiar todo
                </button>
              </div>
            )}

            {/* Resultados */}
            {loading ? (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {filteredProducts.map((product, index) => (
                <PublicProductCard
                  key={product.slug}
                  product={product}
                  index={index}
                />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-line bg-white p-10 text-center">
                <Boxes className="mx-auto mb-4 text-slate-300" size={44} />

                <p className="text-lg font-semibold">
                  No hay productos encontrados.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Prueba con otra búsqueda o limpia los filtros aplicados.
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 inline-flex rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ Panel de filtros (celular) ============ */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Cerrar filtros"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-slate-950/50"
          />

          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="text-base font-bold">Filtros</p>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Cerrar filtros"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {filtersPanel}
            </div>

            <div className="border-t border-line p-4">
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                Ver {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "producto" : "productos"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </main>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function CheckList({
  options,
  selected,
  onToggle,
}: {
  options: { label: string; count: number }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid gap-2.5">
      {options.map((option) => (
        <label
          key={option.label}
          className="flex cursor-pointer items-center gap-3 text-sm text-slate-700 transition hover:text-brand"
        >
          <input
            type="checkbox"
            checked={selected.includes(option.label)}
            onChange={() => onToggle(option.label)}
            className="h-4 w-4 shrink-0 cursor-pointer rounded accent-brand"
          />

          <span className="flex-1 truncate">{option.label}</span>

          <span className="text-xs text-slate-400">{option.count}</span>
        </label>
      ))}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700 transition hover:text-brand">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 cursor-pointer rounded accent-brand"
      />
      {label}
    </label>
  );
}
