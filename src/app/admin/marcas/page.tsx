"use client";

import AdminShell from "@/components/AdminShell";
import ConfirmModal from "@/components/ConfirmModal";
import { supabase } from "@/lib/supabase";
import {
  createSupabaseBrand,
  deleteSupabaseBrand,
  getSupabaseAdminBrands,
  type PublicBrand,
  updateSupabaseBrand,
} from "@/lib/supabase-taxonomies";
import {
  BadgeCheck,
  Eye,
  EyeOff,
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Tag,
  Trash2,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function AdminBrandsPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [brands, setBrands] = useState<PublicBrand[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [brandToDelete, setBrandToDelete] = useState<PublicBrand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    async function checkSessionAndLoad() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        localStorage.removeItem("rca_import_admin_session");
        router.push("/admin/login");
        return;
      }

      setReady(true);
      await loadBrands();
    }

    checkSessionAndLoad();
  }, [router]);

  async function loadBrands() {
    setLoading(true);
    setErrorMessage("");

    const supabaseBrands = await getSupabaseAdminBrands();

    setBrands(supabaseBrands);
    setLoading(false);
  }

  function resetForm() {
    setEditingId("");
    setErrorMessage("");

    setForm({
      name: "",
      slug: "",
      description: "",
      isActive: true,
    });
  }

  function startEditing(brand: PublicBrand) {
    setEditingId(brand.id);
    setErrorMessage("");

    setForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || "",
      isActive: brand.isActive,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (!form.name.trim()) {
      setErrorMessage("Ingresa el nombre de la marca.");
      return;
    }

    const finalSlug = form.slug.trim()
      ? generateSlug(form.slug)
      : generateSlug(form.name);

    if (!finalSlug) {
      setErrorMessage("La marca necesita un slug válido.");
      return;
    }

    setSaving(true);

    if (editingId) {
      const result = await updateSupabaseBrand(editingId, {
        name: form.name.trim(),
        slug: finalSlug,
        description: form.description.trim(),
        isActive: form.isActive,
      });

      setSaving(false);

      if (!result.success) {
        setErrorMessage(
          result.error?.includes("duplicate key")
            ? "Ya existe una marca con ese slug."
            : "No se pudo actualizar la marca."
        );
        return;
      }

      setBrands((currentBrands) =>
        currentBrands.map((brand) =>
          brand.id === editingId
            ? {
                ...brand,
                name: form.name.trim(),
                slug: finalSlug,
                description: form.description.trim(),
                isActive: form.isActive,
              }
            : brand
        )
      );

      resetForm();
      return;
    }

    const result = await createSupabaseBrand({
      name: form.name.trim(),
      slug: finalSlug,
      description: form.description.trim(),
      isActive: form.isActive,
    });

    setSaving(false);

    if (!result.success) {
      setErrorMessage(
        result.error?.includes("duplicate key")
          ? "Ya existe una marca con ese slug."
          : "No se pudo crear la marca."
      );
      return;
    }

    await loadBrands();
    resetForm();
  }

  async function toggleBrand(brand: PublicBrand) {
    setUpdatingId(brand.id);
    setErrorMessage("");

    const result = await updateSupabaseBrand(brand.id, {
      isActive: !brand.isActive,
    });

    if (!result.success) {
      setErrorMessage("No se pudo cambiar el estado de la marca.");
      setUpdatingId("");
      return;
    }

    setBrands((currentBrands) =>
      currentBrands.map((currentBrand) =>
        currentBrand.id === brand.id
          ? { ...currentBrand, isActive: !brand.isActive }
          : currentBrand
      )
    );

    setUpdatingId("");
  }

  async function confirmDeleteBrand() {
    if (!brandToDelete) return;

    setDeletingBrand(true);
    setUpdatingId(brandToDelete.id);
    setErrorMessage("");

    const result = await deleteSupabaseBrand(brandToDelete.id);

    if (!result.success) {
      setErrorMessage(
        "No se pudo eliminar la marca. Puede estar relacionada con productos existentes."
      );
      setUpdatingId("");
      setDeletingBrand(false);
      return;
    }

    setBrands((currentBrands) =>
      currentBrands.filter(
        (currentBrand) => currentBrand.id !== brandToDelete.id
      )
    );

    if (editingId === brandToDelete.id) {
      resetForm();
    }

    setBrandToDelete(null);
    setUpdatingId("");
    setDeletingBrand(false);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("Todas");
  }

  const filteredBrands = useMemo(() => {
    let result = [...brands];

    if (statusFilter === "Activas") {
      result = result.filter((brand) => brand.isActive);
    }

    if (statusFilter === "Inactivas") {
      result = result.filter((brand) => !brand.isActive);
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (brand) =>
          brand.name.toLowerCase().includes(query) ||
          brand.slug.toLowerCase().includes(query) ||
          (brand.description || "").toLowerCase().includes(query)
      );
    }

    return result;
  }, [brands, search, statusFilter]);

  const stats = useMemo(() => {
    const active = brands.filter((brand) => brand.isActive).length;
    const inactive = brands.filter((brand) => !brand.isActive).length;

    return {
      total: brands.length,
      active,
      inactive,
    };
  }, [brands]);

  const activeFilterCount = [
    Boolean(search.trim()),
    statusFilter !== "Todas",
  ].filter(Boolean).length;

  if (!ready) {
    return null;
  }

  return (
    <AdminShell
      title="Marcas"
      description="Administra las marcas reales del catálogo desde Supabase."
    >
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard
          title="Total"
          value={stats.total}
          icon={Tag}
          color="text-[#0057A8]"
          bg="bg-blue-50"
        />

        <StatCard
          title="Activas"
          value={stats.active}
          icon={Eye}
          color="text-green-700"
          bg="bg-green-50"
        />

        <StatCard
          title="Inactivas"
          value={stats.inactive}
          icon={EyeOff}
          color="text-[#E31B23]"
          bg="bg-red-50"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.48fr_1fr]">
        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
            {editingId ? "Editar marca" : "Nueva marca"}
          </p>

          <h2 className="mt-3 text-3xl font-black">
            {editingId ? "Actualizar datos" : "Crear marca"}
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Las marcas activas aparecerán en el catálogo público y en el
            formulario de productos.
          </p>

          {errorMessage && (
            <div className="mt-5 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-[#E31B23]">
              <XCircle className="shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="mt-6 grid gap-4">
            <InputField
              label="Nombre *"
              value={form.name}
              onChange={(value) => setForm({ ...form, name: value })}
              placeholder="Ejemplo: Apple"
              icon={Tag}
            />

            <InputField
              label="Slug"
              value={form.slug}
              onChange={(value) => setForm({ ...form, slug: value })}
              placeholder="Se genera automático si lo dejas vacío"
              icon={Filter}
            />

            <div>
              <label className="text-sm font-black text-slate-700">
                Descripción
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                rows={5}
                placeholder="Describe la marca o el tipo de productos asociados..."
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#0057A8] focus:bg-white"
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-[#f6f8fc] p-4 transition hover:bg-slate-100">
              <div className="flex items-center gap-3">
                <BadgeCheck
                  className={
                    form.isActive ? "text-[#0057A8]" : "text-slate-300"
                  }
                  size={20}
                />

                <p className="text-sm font-black text-slate-700">
                  Marca activa
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm({ ...form, isActive: event.target.checked })
                }
                className="h-5 w-5 accent-[#0057A8]"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingId ? <Save size={18} /> : <Plus size={18} />}
              {saving
                ? "Guardando..."
                : editingId
                ? "Guardar cambios"
                : "Crear marca"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="h-14 rounded-2xl bg-slate-100 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-200"
            >
              {editingId ? "Cancelar edición" : "Limpiar"}
            </button>
          </div>
        </form>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[1fr_190px_160px]">
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
              <Search className="shrink-0 text-slate-400" size={20} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar marca, slug o descripción..."
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

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-14 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 text-sm font-black outline-none transition focus:border-[#0057A8] focus:bg-white"
            >
              <option>Todas</option>
              <option>Activas</option>
              <option>Inactivas</option>
            </select>

            <button
              type="button"
              onClick={loadBrands}
              disabled={loading}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} size={17} />
              Recargar
            </button>
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

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
            {loading ? (
              <div className="p-10 text-center">
                <RefreshCw
                  className="mx-auto mb-4 animate-spin text-[#0057A8]"
                  size={42}
                />

                <p className="font-black">Cargando marcas...</p>
              </div>
            ) : filteredBrands.length > 0 ? (
              <>
                <div className="grid gap-4 p-4 xl:hidden">
                  {filteredBrands.map((brand) => (
                    <BrandMobileCard
                      key={brand.id}
                      brand={brand}
                      updatingId={updatingId}
                      onEdit={startEditing}
                      onToggle={toggleBrand}
                      onDelete={setBrandToDelete}
                    />
                  ))}
                </div>

                <div className="hidden overflow-x-auto xl:block">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-950 text-white">
                      <tr>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em]">
                          Marca
                        </th>

                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em]">
                          Estado
                        </th>

                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em]">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredBrands.map((brand) => (
                        <tr
                          key={brand.id}
                          className="border-b border-slate-200 last:border-b-0"
                        >
                          <td className="min-w-[360px] px-5 py-5 align-top">
                            <BrandInfo brand={brand} />
                          </td>

                          <td className="min-w-[150px] px-5 py-5 align-top">
                            <StatusBadge isActive={brand.isActive} />
                          </td>

                          <td className="min-w-[190px] px-5 py-5 align-top">
                            <BrandActions
                              brand={brand}
                              updatingId={updatingId}
                              onEdit={startEditing}
                              onToggle={toggleBrand}
                              onDelete={setBrandToDelete}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </section>

      <section className="mt-6 rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-200">
        <div className="grid gap-6 md:grid-cols-[1fr_0.35fr] md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
              Marcas conectadas
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Las marcas activas alimentan el catálogo y productos.
            </h2>

            <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
              Si desactivas una marca, dejará de aparecer como opción activa al
              crear o editar productos.
            </p>
          </div>

          <Tag className="text-blue-300" size={52} />
        </div>
      </section>

      <ConfirmModal
        open={Boolean(brandToDelete)}
        title="Eliminar marca"
        description={`¿Seguro que deseas eliminar "${
          brandToDelete?.name ?? ""
        }"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        loading={deletingBrand}
        danger
        onCancel={() => setBrandToDelete(null)}
        onConfirm={confirmDeleteBrand}
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

function InputField({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon: LucideIcon;
}) {
  return (
    <div>
      <label className="text-sm font-black text-slate-700">{label}</label>

      <div className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
        <Icon className="shrink-0 text-slate-400" size={20} />

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function BrandInfo({ brand }: { brand: PublicBrand }) {
  return (
    <div>
      <p className="font-black text-slate-950">{brand.name}</p>

      <p className="mt-1 text-sm font-semibold text-[#0057A8]">
        /marca/{brand.slug}
      </p>

      <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
        {brand.description || "Sin descripción"}
      </p>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${
        isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-[#E31B23]"
      }`}
    >
      {isActive ? <Eye size={15} /> : <EyeOff size={15} />}
      {isActive ? "Activa" : "Inactiva"}
    </span>
  );
}

function BrandActions({
  brand,
  updatingId,
  onEdit,
  onToggle,
  onDelete,
}: {
  brand: PublicBrand;
  updatingId: string;
  onEdit: (brand: PublicBrand) => void;
  onToggle: (brand: PublicBrand) => void;
  onDelete: (brand: PublicBrand) => void;
}) {
  const isUpdating = updatingId === brand.id;

  return (
    <div className="grid gap-2">
      <Link
        href={`/marca/${brand.slug}`}
        target="_blank"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0057A8] px-4 py-3 text-xs font-black text-white transition hover:bg-blue-700"
      >
        <Eye size={16} />
        Ver
      </Link>

      <button
        type="button"
        onClick={() => onEdit(brand)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800"
      >
        <Pencil size={16} />
        Editar
      </button>

      <button
        type="button"
        disabled={isUpdating}
        onClick={() => onToggle(brand)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {brand.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
        {brand.isActive ? "Desactivar" : "Activar"}
      </button>

      <button
        type="button"
        disabled={isUpdating}
        onClick={() => onDelete(brand)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E31B23] px-4 py-3 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 size={16} />
        Eliminar
      </button>
    </div>
  );
}

function BrandMobileCard({
  brand,
  updatingId,
  onEdit,
  onToggle,
  onDelete,
}: {
  brand: PublicBrand;
  updatingId: string;
  onEdit: (brand: PublicBrand) => void;
  onToggle: (brand: PublicBrand) => void;
  onDelete: (brand: PublicBrand) => void;
}) {
  return (
    <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <BrandInfo brand={brand} />

        <StatusBadge isActive={brand.isActive} />
      </div>

      <div className="mt-5">
        <BrandActions
          brand={brand}
          updatingId={updatingId}
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="p-10 text-center">
      <Tag className="mx-auto mb-4 text-slate-400" size={46} />

      <p className="text-2xl font-black">No hay marcas encontradas.</p>

      <p className="mt-2 text-sm font-semibold text-slate-500">
        Crea una nueva marca desde el formulario.
      </p>
    </div>
  );
}