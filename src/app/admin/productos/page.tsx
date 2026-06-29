"use client";

import AdminShell from "@/components/AdminShell";
import ConfirmModal from "@/components/ConfirmModal";
import { supabase } from "@/lib/supabase";
import {
  deleteSupabaseProductBySlug,
  getSupabaseAdminProducts,
  type PublicProduct,
  updateSupabaseProductBySlug,
} from "@/lib/supabase-products";
import {
  BadgeCheck,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  Filter,
  ImageIcon,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  Trash2,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const filterOptions = [
  "Todos",
  "Visibles",
  "Ocultos",
  "Disponibles",
  "Agotados",
  "Destacados",
  "Mayorista",
];

const sortOptions = [
  "Más recientes",
  "Nombre A-Z",
  "Nombre Z-A",
  "Menor precio",
  "Mayor precio",
  "Mayor stock",
];

type ProductUpdates = {
  visible?: boolean;
  available?: boolean;
  featured?: boolean;
  tag?: string;
};

function getStock(product: PublicProduct) {
  return Math.max(product.stock - product.reservedStock, 0);
}

function getFinalPrice(product: PublicProduct) {
  return product.salePrice ?? product.price;
}

export default function AdminProductsPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [sort, setSort] = useState("Más recientes");
  const [loading, setLoading] = useState(true);
  const [updatingSlug, setUpdatingSlug] = useState("");
  const [productToDelete, setProductToDelete] =
    useState<PublicProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  useEffect(() => {
    async function checkSessionAndLoad() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        localStorage.removeItem("rca_import_admin_session");
        router.push("/admin/login");
        return;
      }

      setReady(true);
      await loadProducts();
    }

    checkSessionAndLoad();
  }, [router]);

  async function loadProducts() {
    setLoading(true);

    const supabaseProducts = await getSupabaseAdminProducts();

    setProducts(supabaseProducts);
    setLoading(false);
  }

  async function updateProduct(product: PublicProduct, updates: ProductUpdates) {
    setUpdatingSlug(product.slug);

    const result = await updateSupabaseProductBySlug(product.slug, updates);

    if (result.success) {
      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.slug === product.slug
            ? { ...currentProduct, ...updates }
            : currentProduct
        )
      );
    }

    setUpdatingSlug("");
  }

  async function confirmDeleteProduct() {
    if (!productToDelete) {
      return;
    }

    setDeletingProduct(true);
    setUpdatingSlug(productToDelete.slug);

    const result = await deleteSupabaseProductBySlug(productToDelete.slug);

    if (result.success) {
      setProducts((currentProducts) =>
        currentProducts.filter(
          (currentProduct) => currentProduct.slug !== productToDelete.slug
        )
      );

      setProductToDelete(null);
    }

    setUpdatingSlug("");
    setDeletingProduct(false);
  }

  function resetFilters() {
    setSearch("");
    setFilter("Todos");
    setSort("Más recientes");
  }

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (filter === "Visibles") {
      result = result.filter((product) => product.visible !== false);
    }

    if (filter === "Ocultos") {
      result = result.filter((product) => product.visible === false);
    }

    if (filter === "Disponibles") {
      result = result.filter(
        (product) => product.available !== false && getStock(product) > 0
      );
    }

    if (filter === "Agotados") {
      result = result.filter(
        (product) => product.available === false || getStock(product) <= 0
      );
    }

    if (filter === "Destacados") {
      result = result.filter((product) => product.featured);
    }

    if (filter === "Mayorista") {
      result = result.filter((product) => product.wholesale);
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.slug.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.country.toLowerCase().includes(query) ||
          product.tag.toLowerCase().includes(query)
      );
    }

    if (sort === "Nombre A-Z") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sort === "Nombre Z-A") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    if (sort === "Menor precio") {
      result.sort((a, b) => getFinalPrice(a) - getFinalPrice(b));
    }

    if (sort === "Mayor precio") {
      result.sort((a, b) => getFinalPrice(b) - getFinalPrice(a));
    }

    if (sort === "Mayor stock") {
      result.sort((a, b) => getStock(b) - getStock(a));
    }

    return result;
  }, [products, search, filter, sort]);

  const stats = useMemo(() => {
    const visible = products.filter(
      (product) => product.visible !== false
    ).length;

    const hidden = products.filter(
      (product) => product.visible === false
    ).length;

    const outOfStock = products.filter(
      (product) => product.available === false || getStock(product) <= 0
    ).length;

    const featured = products.filter((product) => product.featured).length;

    const wholesale = products.filter((product) => product.wholesale).length;

    return {
      total: products.length,
      visible,
      hidden,
      outOfStock,
      featured,
      wholesale,
    };
  }, [products]);

  const activeFilterCount = [
    Boolean(search.trim()),
    filter !== "Todos",
    sort !== "Más recientes",
  ].filter(Boolean).length;

  if (!ready) {
    return null;
  }

  return (
    <AdminShell
      title="Productos"
      description="Administra el catálogo real de productos guardados en Supabase."
    >
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard
          title="Total"
          value={stats.total}
          icon={Package}
          color="text-[#0057A8]"
          bg="bg-blue-50"
        />

        <StatCard
          title="Visibles"
          value={stats.visible}
          icon={Eye}
          color="text-green-700"
          bg="bg-green-50"
        />

        <StatCard
          title="Ocultos"
          value={stats.hidden}
          icon={EyeOff}
          color="text-slate-700"
          bg="bg-slate-100"
        />

        <StatCard
          title="Agotados"
          value={stats.outOfStock}
          icon={XCircle}
          color="text-[#E31B23]"
          bg="bg-red-50"
        />

        <StatCard
          title="Destacados"
          value={stats.featured}
          icon={Star}
          color="text-amber-700"
          bg="bg-amber-50"
        />

        <StatCard
          title="Mayorista"
          value={stats.wholesale}
          icon={Tag}
          color="text-purple-700"
          bg="bg-purple-50"
        />
      </section>

      <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_210px_210px_150px_190px]">
          <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
            <Search className="shrink-0 text-slate-400" size={20} />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar producto, categoría, marca, país o etiqueta..."
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
            <Filter className="shrink-0 text-slate-400" size={20} />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-full w-full bg-transparent text-sm font-black text-slate-700 outline-none"
            >
              {filterOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
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
            onClick={loadProducts}
            disabled={loading}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={17} />
            Recargar
          </button>

          <Link
            href="/admin/productos/nuevo"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-5 text-sm font-black text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Nuevo producto
          </Link>
        </div>

        {activeFilterCount > 0 && (
          <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl bg-blue-50 p-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <Sparkles className="text-[#0057A8]" size={20} />

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

      <section className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
              Catálogo admin
            </p>

            <h2 className="mt-3 text-3xl font-black">
              {filteredProducts.length} producto(s)
            </h2>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Controla visibilidad, disponibilidad, destacados y edición del
              catálogo.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f6f8fc] px-5 py-3 text-sm font-black text-slate-600">
            <ShoppingBag size={18} className="text-[#0057A8]" />
            Supabase conectado
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <RefreshCw
              className="mx-auto mb-4 animate-spin text-[#0057A8]"
              size={42}
            />

            <p className="font-black">Cargando productos desde Supabase...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="grid gap-4 p-4 lg:hidden">
              {filteredProducts.map((product) => (
                <MobileProductCard
                  key={product.slug}
                  product={product}
                  isUpdating={updatingSlug === product.slug}
                  onUpdate={updateProduct}
                  onDelete={setProductToDelete}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.16em]">
                      Producto
                    </th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.16em]">
                      Precio
                    </th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.16em]">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.16em]">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.16em]">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => {
                    const stock = getStock(product);
                    const finalPrice = getFinalPrice(product);
                    const isUpdating = updatingSlug === product.slug;

                    return (
                      <tr
                        key={product.slug}
                        className="border-b border-slate-200 last:border-b-0"
                      >
                        <td className="min-w-[360px] px-6 py-5 align-top">
                          <div className="flex gap-4">
                            <ProductImage product={product} />

                            <div className="min-w-0">
                              <p className="line-clamp-2 font-black text-slate-950">
                                {product.name}
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-500">
                                {product.category} · {product.brand}
                              </p>

                              <p className="mt-1 text-xs font-bold text-slate-400">
                                {product.countryFlag} {product.country} ·{" "}
                                {product.condition}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <StatusPill
                                  text={product.tag || "Sin etiqueta"}
                                  className="bg-blue-50 text-[#0057A8]"
                                />

                                {product.wholesale && (
                                  <StatusPill
                                    text="Mayorista"
                                    className="bg-purple-50 text-purple-700"
                                  />
                                )}

                                {product.featured && (
                                  <StatusPill
                                    text="Destacado"
                                    className="bg-amber-50 text-amber-700"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="min-w-[130px] px-6 py-5 align-top">
                          <p className="text-xl font-black text-[#E31B23]">
                            S/ {finalPrice}
                          </p>

                          {product.salePrice && (
                            <p className="mt-1 text-sm font-bold text-slate-400 line-through">
                              S/ {product.price}
                            </p>
                          )}
                        </td>

                        <td className="min-w-[190px] px-6 py-5 align-top">
                          <div className="rounded-2xl bg-[#f6f8fc] p-4">
                            <Boxes className="mb-3 text-[#0057A8]" size={22} />

                            <p className="text-sm font-black">
                              Disponible: {stock}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              Stock: {product.stock} · Reservado:{" "}
                              {product.reservedStock}
                            </p>
                          </div>
                        </td>

                        <td className="min-w-[210px] px-6 py-5 align-top">
                          <ProductStatus product={product} />

                          <div className="mt-3 grid gap-2">
                            <ToggleButton
                              disabled={isUpdating}
                              onClick={() =>
                                updateProduct(product, {
                                  visible: product.visible === false,
                                })
                              }
                              icon={
                                product.visible !== false ? EyeOff : Eye
                              }
                              label={
                                product.visible !== false
                                  ? "Ocultar"
                                  : "Mostrar"
                              }
                            />

                            <ToggleButton
                              disabled={isUpdating}
                              onClick={() =>
                                updateProduct(product, {
                                  available: product.available === false,
                                })
                              }
                              icon={
                                product.available !== false
                                  ? XCircle
                                  : BadgeCheck
                              }
                              label={
                                product.available !== false
                                  ? "Agotar"
                                  : "Disponible"
                              }
                            />
                          </div>
                        </td>

                        <td className="min-w-[180px] px-6 py-5 align-top">
                          <ProductActions
                            product={product}
                            isUpdating={isUpdating}
                            onUpdate={updateProduct}
                            onDelete={setProductToDelete}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-10 text-center">
            <Package className="mx-auto mb-4 text-slate-400" size={46} />

            <p className="text-2xl font-black">No hay productos encontrados.</p>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Agrega productos desde el panel o revisa los filtros aplicados.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/admin/productos/nuevo"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white"
              >
                <Plus size={18} />
                Crear producto
              </Link>

              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white"
              >
                <X size={18} />
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </section>

      <ConfirmModal
        open={Boolean(productToDelete)}
        title="Eliminar producto"
        description={`¿Seguro que deseas eliminar "${
          productToDelete?.name ?? ""
        }"? Esta acción también lo quitará del catálogo público y no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        loading={deletingProduct}
        danger
        onCancel={() => setProductToDelete(null)}
        onConfirm={confirmDeleteProduct}
      />
    </AdminShell>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}
        >
          <Icon className={color} size={24} />
        </div>
      </div>
    </div>
  );
}

function ProductImage({ product }: { product: PublicProduct }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f6f8fc] ring-1 ring-slate-200">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <ImageIcon className="text-slate-400" size={30} />
      )}
    </div>
  );
}

function StatusPill({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  return (
    <span className={`rounded-full px-3 py-2 text-xs font-black ${className}`}>
      {text}
    </span>
  );
}

function ProductStatus({ product }: { product: PublicProduct }) {
  const stock = getStock(product);

  return (
    <div className="flex flex-wrap gap-2">
      <StatusPill
        text={product.visible !== false ? "Visible" : "Oculto"}
        className={
          product.visible !== false
            ? "bg-green-50 text-green-700"
            : "bg-slate-100 text-slate-600"
        }
      />

      <StatusPill
        text={product.available !== false && stock > 0 ? "Disponible" : "Agotado"}
        className={
          product.available !== false && stock > 0
            ? "bg-blue-50 text-[#0057A8]"
            : "bg-red-50 text-[#E31B23]"
        }
      />
    </div>
  );
}

function ToggleButton({
  disabled,
  onClick,
  icon: Icon,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function ProductActions({
  product,
  isUpdating,
  onUpdate,
  onDelete,
}: {
  product: PublicProduct;
  isUpdating: boolean;
  onUpdate: (product: PublicProduct, updates: ProductUpdates) => void;
  onDelete: (product: PublicProduct) => void;
}) {
  return (
    <div className="grid gap-2">
      <Link
        href={`/producto/${product.slug}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0057A8] px-4 py-3 text-xs font-black text-white transition hover:bg-blue-700"
      >
        <ExternalLink size={16} />
        Ver
      </Link>

      <Link
        href={`/admin/productos/${product.slug}/editar`}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800"
      >
        <Pencil size={16} />
        Editar
      </Link>

      <button
        type="button"
        disabled={isUpdating}
        onClick={() =>
          onUpdate(product, {
            featured: !product.featured,
          })
        }
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-black text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Star size={16} />
        {product.featured ? "Quitar destaque" : "Destacar"}
      </button>

      <button
        type="button"
        disabled={isUpdating}
        onClick={() => onDelete(product)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E31B23] px-4 py-3 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 size={16} />
        Eliminar
      </button>
    </div>
  );
}

function MobileProductCard({
  product,
  isUpdating,
  onUpdate,
  onDelete,
}: {
  product: PublicProduct;
  isUpdating: boolean;
  onUpdate: (product: PublicProduct, updates: ProductUpdates) => void;
  onDelete: (product: PublicProduct) => void;
}) {
  const stock = getStock(product);
  const finalPrice = getFinalPrice(product);

  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-4 p-4 sm:grid-cols-[90px_1fr]">
        <ProductImage product={product} />

        <div className="min-w-0">
          <p className="line-clamp-2 text-lg font-black text-slate-950">
            {product.name}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {product.category} · {product.brand}
          </p>

          <p className="mt-1 text-xs font-bold text-slate-400">
            {product.countryFlag} {product.country} · {product.condition}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill
              text={product.tag || "Sin etiqueta"}
              className="bg-blue-50 text-[#0057A8]"
            />

            {product.wholesale && (
              <StatusPill text="Mayorista" className="bg-purple-50 text-purple-700" />
            )}

            {product.featured && (
              <StatusPill text="Destacado" className="bg-amber-50 text-amber-700" />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-y border-slate-200 bg-[#f6f8fc] p-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Precio
          </p>

          <p className="mt-1 text-xl font-black text-[#E31B23]">
            S/ {finalPrice}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Stock
          </p>

          <p className="mt-1 text-xl font-black text-slate-950">{stock}</p>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Reserva
          </p>

          <p className="mt-1 text-xl font-black text-slate-950">
            {product.reservedStock}
          </p>
        </div>
      </div>

      <div className="p-4">
        <ProductStatus product={product} />

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <ToggleButton
            disabled={isUpdating}
            onClick={() =>
              onUpdate(product, {
                visible: product.visible === false,
              })
            }
            icon={product.visible !== false ? EyeOff : Eye}
            label={product.visible !== false ? "Ocultar" : "Mostrar"}
          />

          <ToggleButton
            disabled={isUpdating}
            onClick={() =>
              onUpdate(product, {
                available: product.available === false,
              })
            }
            icon={product.available !== false ? XCircle : BadgeCheck}
            label={product.available !== false ? "Agotar" : "Disponible"}
          />
        </div>

        <div className="mt-3">
          <ProductActions
            product={product}
            isUpdating={isUpdating}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </div>
      </div>
    </article>
  );
}